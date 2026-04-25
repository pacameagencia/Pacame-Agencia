/**
 * Helpers para Server Components y route handlers que necesitan
 * la sesión del usuario PACAME product (asesor o cliente-final).
 *
 * Convenciones:
 *   - getCurrentProductUser() → ProductUser | null  (no redirect)
 *   - requireProductUser()    → ProductUser         (throw + redirect si no)
 *   - requireRole(role)       → ProductUser         (403 si no tiene el rol)
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBySessionToken, SESSION_COOKIE, type ProductUser } from "./auth";

export async function getCurrentProductUser(): Promise<ProductUser | null> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getUserBySessionToken(token);
}

export async function requireProductUser(redirectTo = "/p"): Promise<ProductUser> {
  const user = await getCurrentProductUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireOwnerOrAdmin(): Promise<ProductUser> {
  const user = await requireProductUser();
  if (user.role !== "owner" && user.role !== "admin") {
    // Cliente-final logueado intentando acceder al panel del asesor
    redirect(`/app/asesor-pro/cliente`);
  }
  return user;
}
