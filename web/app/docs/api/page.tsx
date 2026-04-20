import type { Metadata } from "next";
import SwaggerClient from "./SwaggerClient";

// La spec se revalida cada hora (igual que /api/docs).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PACAME API Docs",
  description:
    "Documentacion interactiva de la API publica del marketplace PACAME.",
  robots: { index: false, follow: false },
};

export default function ApiDocsPage() {
  // SwaggerClient tiene "use client" en su file, por lo que Next.js lo
  // renderiza solo en cliente. No necesitamos next/dynamic con ssr:false,
  // que ademas ya no se permite desde Next 16 en Server Components.
  return <SwaggerClient />;
}
