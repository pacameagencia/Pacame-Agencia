/**
 * Admin sessions — persistencia de sesiones de dashboard en Supabase.
 *
 * Sustituye el `Set<string>` in-memory que perdia tokens en cada deploy.
 * Tabla: admin_sessions (migracion 014 ya aplicada en produccion).
 */

import { createHash, randomBytes } from "crypto";
import { createServerSupabase } from "../supabase/server";
import { getLogger } from "@/lib/observability/logger";

export interface AdminSession {
  user_id: string;
  role: "admin" | "staff";
  created_at: string;
  expires_at: string;
}

export const ADMIN_COOKIE = "pacame_auth";
export const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// ──────────────────────────────────────────────────────────────────
// Dual-read: fallback in-memory para sesiones emitidas pre-deploy.
// Se sigue usando hasta que la ventana de dual-read se apague.
// ──────────────────────────────────────────────────────────────────

const legacyMemoryTokens = new Set<string>();

export function addLegacyToken(token: string) {
  legacyMemoryTokens.add(token);
}
export function dropLegacyToken(token: string) {
  legacyMemoryTokens.delete(token);
}
export function hasLegacyToken(token: string): boolean {
  return legacyMemoryTokens.has(token);
}
export function isDualReadEnabled(): boolean {
  return process.env.AUTH_DUAL_READ === "true";
}

// ──────────────────────────────────────────────────────────────────
// Core DB ops
// ──────────────────────────────────────────────────────────────────

interface CreateSessionParams {
  userId: string;
  role?: "admin" | "staff";
  ip?: string | null;
  userAgent?: string | null;
  ttlSeconds?: number;
}

export async function createSession(
  params: CreateSessionParams
): Promise<{ token: string; tokenHash: string; expiresAt: Date } | null> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const ttl = params.ttlSeconds ?? SESSION_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  const supabase = createServerSupabase();
  const { error } = await supabase.from("admin_sessions").insert({
    token_hash: tokenHash,
    user_id: params.userId,
    role: params.role ?? "admin",
    expires_at: expiresAt.toISOString(),
    ip: params.ip || null,
    user_agent: params.userAgent || null,
  });

  if (error) {
    getLogger().error({ errMessage: error.message }, "[admin-sessions] createSession error");
    return null;
  }

  return { token, tokenHash, expiresAt };
}

export async function verifySession(token: string): Promise<AdminSession | null> {
  const tokenHash = hashToken(token);
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("admin_sessions")
    .select("user_id, role, created_at, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at as string) <= new Date()) return null;

  // fire-and-forget update last_used_at (no bloquear la request)
  supabase
    .from("admin_sessions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .then(
      () => {},
      (e) => getLogger().error({ err: e }, "[admin-sessions] last_used_at update failed")
    );

  return {
    user_id: data.user_id as string,
    role: data.role as "admin" | "staff",
    created_at: data.created_at as string,
    expires_at: data.expires_at as string,
  };
}

export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
  if (error) {
    getLogger().error({ errMessage: error.message }, "[admin-sessions] revokeSession error");
  }
}

/**
 * Borra sesiones revocadas o expiradas hace mas de 30 dias.
 * Pensado para un cron semanal.
 */
export async function cleanupExpiredSessions(): Promise<{ deleted: number }> {
  const supabase = createServerSupabase();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  // borra si revoked_at IS NOT NULL o expires_at < cutoff
  const { data, error } = await supabase
    .from("admin_sessions")
    .delete()
    .or(`revoked_at.not.is.null,expires_at.lt.${cutoff}`)
    .select("id");
  if (error) {
    getLogger().error({ errMessage: error.message }, "[admin-sessions] cleanup error");
    return { deleted: 0 };
  }
  return { deleted: data?.length || 0 };
}
