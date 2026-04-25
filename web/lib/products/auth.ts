/**
 * Auth para usuarios de productos PACAME (asesores + sus clientes finales).
 *
 * Diferente del dashboard interno PACAME (`dashboard-auth.ts`):
 *   - Aquí los users son TENANTS pagando suscripción (asesores)
 *   - Sus clients-of-asesor también tienen login (rol distinto)
 *
 * Schema:
 *   - `pacame_product_users.password_hash` (bcrypt, hash en API route node)
 *   - `pacame_product_users.auth_token` (rotado en login, expira 30d)
 *
 * Cookie: `pacame_product_session=<token>` (httpOnly, secure, sameSite=lax)
 */

import crypto from "node:crypto";
import { createServerSupabase } from "@/lib/supabase/server";

const TOKEN_TTL_DAYS = 30;
const SESSION_COOKIE_NAME = "pacame_product_session";

export interface ProductUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member" | "client_of";
  parent_user_id: string | null;
  email_verified_at: string | null;
}

/**
 * Genera un session token criptográficamente seguro.
 * Format: <32 bytes random> en base64url.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Hash password con scrypt (built-in Node, no requiere bcrypt).
 * Format: scrypt$N$r$p$salt$hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const N = 16384, r = 8, p = 1;
  const hash = crypto.scryptSync(password, salt, 64, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
    const N = parseInt(nStr, 10), r = parseInt(rStr, 10), p = parseInt(pStr, 10);
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const computed = crypto.scryptSync(password, salt, expected.length, { N, r, p });
    return crypto.timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}

/**
 * Crea un user nuevo o devuelve el existente si email ya registrado.
 * Útil en el signup de trial: si el asesor vuelve, no duplicamos.
 */
export async function findOrCreateUser(input: {
  email: string;
  full_name?: string;
  phone?: string;
  password?: string;
  role?: ProductUser["role"];
}): Promise<{ user: ProductUser; created: boolean }> {
  const supabase = createServerSupabase();
  const email = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("pacame_product_users")
    .select("id, email, full_name, role, parent_user_id, email_verified_at")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return { user: existing as ProductUser, created: false };
  }

  const passwordHash = input.password ? hashPassword(input.password) : null;
  const { data, error } = await supabase
    .from("pacame_product_users")
    .insert({
      email,
      full_name: input.full_name ?? null,
      phone: input.phone ?? null,
      password_hash: passwordHash,
      role: input.role ?? "owner",
    })
    .select("id, email, full_name, role, parent_user_id, email_verified_at")
    .single();

  if (error || !data) {
    throw new Error(`createUser failed: ${error?.message ?? "unknown"}`);
  }
  return { user: data as ProductUser, created: true };
}

/**
 * Crea sesión (rotando token) y devuelve el cookie value.
 */
export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
  const supabase = createServerSupabase();
  const token = generateSessionToken();
  const expires = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await supabase
    .from("pacame_product_users")
    .update({
      auth_token: token,
      auth_token_expires: expires.toISOString(),
      last_login_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return { token, expires };
}

export async function getUserBySessionToken(token: string): Promise<ProductUser | null> {
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("pacame_product_users")
    .select("id, email, full_name, role, parent_user_id, email_verified_at, auth_token_expires")
    .eq("auth_token", token)
    .single();

  if (!data) return null;
  if (data.auth_token_expires && new Date(data.auth_token_expires) < new Date()) {
    return null;
  }
  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role,
    parent_user_id: data.parent_user_id,
    email_verified_at: data.email_verified_at,
  };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;

export function buildSessionCookie(token: string, expires: Date): string {
  const maxAge = Math.floor((expires.getTime() - Date.now()) / 1000);
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}
