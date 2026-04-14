import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dejar una Resena — PACAME",
  description:
    "Comparte tu experiencia con PACAME. Tu opinion nos ayuda a mejorar y ayuda a otros negocios a tomar la decision correcta.",
  alternates: { canonical: "https://pacameagencia.com/review" },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
