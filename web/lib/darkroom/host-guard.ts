/**
 * DarkRoom — Host Guard.
 *
 * Las páginas `/legal/*` solo deben renderizarse si el host de la request es
 * `darkroomcreative.cloud` (o subdominios). Si alguien las visita desde
 * `pacameagencia.com` o cualquier otro host: 404.
 *
 * Esto refuerza la regla `arquitectura-3-capas.md:96` (DarkRoom no asociada
 * a PACAME en público) — sin host correcto, las URLs no existen.
 *
 * Uso típico (server component):
 *
 *   import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
 *   import { notFound } from "next/navigation";
 *
 *   export default async function Page() {
 *     await ensureDarkRoomHost();
 *     return <article>…</article>;
 *   }
 */

import { headers } from "next/headers";
import { notFound } from "next/navigation";

const ALLOWED_HOST_SUFFIXES = [
  "darkroomcreative.cloud",
  // Añadir aquí staging si se monta: "staging.darkroomcreative.cloud"
];

const ALLOWED_DEV_HOSTS = [
  "localhost",
  "127.0.0.1",
];

/** True si el host actual está autorizado a servir contenido DarkRoom. */
export async function isDarkRoomHost(): Promise<boolean> {
  const h = await headers();
  // Vercel pone host en `x-forwarded-host`; fallback a `host`.
  const raw = (h.get("x-forwarded-host") || h.get("host") || "").toLowerCase().trim();
  if (!raw) return false;

  // Permitir dev local con `?dr=1` solo si NODE_ENV no es production
  if (process.env.NODE_ENV !== "production") {
    if (ALLOWED_DEV_HOSTS.some((d) => raw.startsWith(d))) return true;
  }

  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => raw === suffix || raw.endsWith(`.${suffix}`)
  );
}

/**
 * Llama esto al inicio de cada server page DarkRoom. Si el host no es
 * `darkroomcreative.cloud`, lanza notFound() (Next.js renderiza 404).
 *
 * Esto asegura que `pacameagencia.com/legal/...` devuelva 404 sin filtrar
 * que la página existe en otro host.
 */
export async function ensureDarkRoomHost(): Promise<void> {
  const ok = await isDarkRoomHost();
  if (!ok) notFound();
}
