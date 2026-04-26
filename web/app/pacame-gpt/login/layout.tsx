import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entra en PACAME GPT · Lucía",
  description:
    "Crea tu cuenta gratis en PACAME GPT y empieza 14 días ilimitado con Lucía. Sin tarjeta. 9,90€/mes después o sigues con la versión gratis (20 msg/día).",
  alternates: { canonical: "https://pacameagencia.com/pacame-gpt/login" },
  robots: { index: false, follow: false },
};

export default function PacameGptLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
