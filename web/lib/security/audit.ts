/**
 * Audit log — registro inmutable de acciones sensibles.
 *
 * Reglas:
 *  - NUNCA lanza excepciones. Un fallo de audit nunca puede romper la operacion.
 *  - Captura IP + user-agent desde el NextRequest si se pasa.
 *  - Captura requestId automaticamente desde el context (AsyncLocalStorage).
 *  - Service role: el caller ya esta autenticado, este helper solo persiste.
 */

import type { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getContext } from "@/lib/observability/request-context";
import { getLogger } from "@/lib/observability/logger";

export type ActorType = "admin" | "staff" | "client" | "system" | "webhook";

export interface AuditEntry {
  actor: { type: ActorType; id?: string | null };
  /** dot-notation, ej: "auth.login", "catalog.update", "gdpr.export" */
  action: string;
  resource?: { type: string; id?: string | null };
  metadata?: Record<string, unknown>;
  request?: NextRequest | null;
}

function extractIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || null;
}

export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServerSupabase();
    const ctx = getContext();
    const ip = entry.request ? extractIp(entry.request) : null;
    const ua = entry.request?.headers.get("user-agent") || null;

    await supabase.from("audit_log").insert({
      actor_type: entry.actor.type,
      actor_id: entry.actor.id || null,
      action: entry.action,
      resource_type: entry.resource?.type || null,
      resource_id: entry.resource?.id || null,
      metadata: entry.metadata || {},
      ip,
      user_agent: ua,
      request_id: ctx?.requestId || null,
    });
  } catch (err) {
    // Fallo de audit NUNCA debe romper la op de negocio.
    getLogger().warn({ err, action: entry.action }, "auditLog insert failed");
  }
}
