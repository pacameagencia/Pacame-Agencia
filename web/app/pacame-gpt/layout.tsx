import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PACAME GPT · Lucía, el ChatGPT que habla como tú",
  description:
    "Lucía es la asistente IA de PACAME en español de España. Te ayuda a redactar emails, mensajes, traducir, resumir y mucho más. Versión gratis 20 mensajes al día. 9,90€/mes ilimitado, con factura.",
  alternates: { canonical: "https://pacameagencia.com/pacame-gpt" },
  openGraph: {
    title: "PACAME GPT · Lucía",
    description:
      "El ChatGPT que habla como tú, en euros, sin liarte. Lucía es nuestra IA española.",
    url: "https://pacameagencia.com/pacame-gpt",
    type: "website",
    locale: "es_ES",
  },
  robots: { index: true, follow: true },
};

export default function PacameGptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
