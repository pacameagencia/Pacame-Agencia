import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jarvis · Asistente IA de PACAME",
  description:
    "Habla con Jarvis, el asistente de inteligencia artificial de PACAME. Te ayuda con tu negocio digital — webs, SEO, anuncios, redes sociales — en una conversación natural por voz o texto.",
  alternates: { canonical: "https://pacameagencia.com/companero" },
  openGraph: {
    title: "Jarvis · El asistente IA de PACAME",
    description:
      "El nuevo Jarvis de PACAME. Habla con él sobre tu negocio. Responde con voz humana en español.",
    url: "https://pacameagencia.com/companero",
    type: "website",
    locale: "es_ES",
  },
  robots: { index: true, follow: true },
};

export default function CompaneroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
