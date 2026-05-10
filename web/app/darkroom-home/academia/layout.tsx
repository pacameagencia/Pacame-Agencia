/**
 * Dark Academy · Layout de la sección de academia.
 *
 * Servida en `darkroomcreative.cloud/academia/*` mediante rewrite del
 * middleware. Acceso directo a `/darkroom-home/academia/*` desde otros
 * hosts está bloqueado por `ensureDarkRoomHost` en cada page.
 *
 * Hereda el cookie banner del layout padre `/darkroom-home`.
 * No define metadata global — cada página define la suya.
 */

import type { ReactNode } from "react";

export default function DarkAcademyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
