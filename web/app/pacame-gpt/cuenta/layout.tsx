import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu cuenta · PACAME GPT",
  description: "Gestiona tu cuenta de PACAME GPT y pasa a Premium si quieres mensajes ilimitados.",
  robots: { index: false, follow: false },
};

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
