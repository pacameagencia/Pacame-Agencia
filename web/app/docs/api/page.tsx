import type { Metadata } from "next";
import dynamic from "next/dynamic";

// La spec se revalida cada hora (igual que /api/docs).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PACAME API Docs",
  description:
    "Documentacion interactiva de la API publica del marketplace PACAME.",
  robots: { index: false, follow: false },
};

const SwaggerUI = dynamic(() => import("./SwaggerClient"), { ssr: false });

export default function ApiDocsPage() {
  return <SwaggerUI />;
}
