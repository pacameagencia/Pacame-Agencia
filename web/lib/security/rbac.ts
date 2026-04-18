/**
 * RBAC — role-based access control para rutas admin/staff + ownership clientes.
 *
 * Expone:
 *  - getAdminSession(req): lee cookie y valida contra admin_sessions.
 *  - requireRole(req, roles): devuelve session o NextResponse 401/403.
 *  - hasPermission(session, perm): consulta role_permissions cacheada 60s.
 *  - withRoleAndPermission(...)(handler): wrapper para handlers.
 *  - requireClientOwnership(req, clientId): bloquea cliente A leyendo cliente B.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  verifySession,
  type AdminSession,
} from "./admin-sessions";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";

// ──────────────────────────────────────────────────────────────────
// Permission cache (60s TTL global para todos los roles)
// ──────────────────────────────────────────────────────────────────

const permissionCache = new Map<string, Set<string>>();
let permissionCacheLoadedAt = 0;
const PERMISSION_TTL_MS = 60_000;

async function loadPermissions(role: string): Promise<Set<string>> {
  const now = Date.now();
  if (
    permissionCache.has(role) &&
    now - permissionCacheLoadedAt < PERMISSION_TTL_MS
  ) {
    return permissionCache.get(role)!;
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("role, permission");

  if (error) {
    getLogger().warn({ err: error }, "[rbac] loadPermissions failed");
    // No vacio el cache si ya tenia datos validos previos
    return permissionCache.get(role) || new Set();
  }

  permissionCache.clear();
  for (const row of data || []) {
    const r = row.role as string;
    if (!permissionCache.has(r)) permissionCache.set(r, new Set());
    permissionCache.get(r)!.add(row.permission as string);
  }
  permissionCacheLoadedAt = now;
  return permissionCache.get(role) || new Set();
}

// ──────────────────────────────────────────────────────────────────
// Session + role gates
// ──────────────────────────────────────────────────────────────────

export async function getAdminSession(
  request: NextRequest
): Promise<AdminSession | null> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return await verifySession(token);
}

/**
 * Exige sesion admin con al menos uno de los roles dados.
 * Devuelve AdminSession si ok, o NextResponse 401/403 si no.
 */
export async function requireRole(
  request: NextRequest,
  roles: Array<"admin" | "staff">
): Promise<AdminSession | NextResponse> {
  const session = await getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!roles.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

/**
 * Comprueba permiso fino desde role_permissions.
 * Usar despues de requireRole() para permisos granulares.
 */
export async function hasPermission(
  session: AdminSession,
  permission: string
): Promise<boolean> {
  const perms = await loadPermissions(session.role);
  return perms.has(permission);
}

/**
 * Wrapper: requireRole + opcionalmente hasPermission.
 *
 *   export const GET = withRoleAndPermission(['admin'], 'catalog.manage')(
 *     async (req) => { ... }
 *   );
 */
export function withRoleAndPermission(
  roles: Array<"admin" | "staff">,
  permission?: string
) {
  return <
    H extends (
      req: NextRequest,
      ...rest: unknown[]
    ) => Promise<Response> | Response,
  >(
    handler: H
  ) =>
    (async (req: NextRequest, ...rest: unknown[]) => {
      const sessionOrResp = await requireRole(req, roles);
      if (sessionOrResp instanceof NextResponse) return sessionOrResp;
      if (permission && !(await hasPermission(sessionOrResp, permission))) {
        return NextResponse.json(
          { error: "Forbidden", permission_required: permission },
          { status: 403 }
        );
      }
      return handler(req, ...rest);
    }) as H;
}

// ──────────────────────────────────────────────────────────────────
// Client portal ownership
// ──────────────────────────────────────────────────────────────────

/**
 * Exige que el cliente autenticado sea dueno del recurso.
 * Bloquea el clasico "cliente A leyendo recurso de cliente B".
 *
 * Devuelve null si ok, o NextResponse 401/403 si no.
 * Si `resourceClientId` es null (ej: pedido sin cliente), solo valida auth.
 */
export async function requireClientOwnership(
  request: NextRequest,
  resourceClientId: string | null
): Promise<NextResponse | null> {
  // Lazy import para evitar import circular (client-auth -> server supabase).
  const { getAuthedClient } = await import("@/lib/client-auth");
  const client = await getAuthedClient(request);
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (resourceClientId && resourceClientId !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
