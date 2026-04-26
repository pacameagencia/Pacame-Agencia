import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, formatTierLimits } from "@/lib/products/registry";
import AsesorProLanding from "./AsesorProLanding";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AsesorPro · El sistema operativo del asesor fiscal · PACAME",
  description:
    "Tus clientes facturan desde su panel, suben tickets por foto, tú revisas en 30 segundos y el pack mensual ZIP se empaqueta solo. Cero WhatsApp infierno.",
  alternates: { canonical: "https://pacameagencia.com/p/asesor-pro" },
  openGraph: {
    title: "AsesorPro · El sistema operativo del asesor fiscal",
    description:
      "Cero WhatsApp infierno. Tus clientes facturan, tú revisas, todo empaquetado al final del mes.",
    url: "https://pacameagencia.com/p/asesor-pro",
    type: "website",
  },
};

export default async function AsesorProLandingPage() {
  const product = await getProduct("asesor-pro");
  if (!product || !["live", "beta"].includes(product.status)) notFound();

  const tiers = product.pricing.map((t) => ({
    ...t,
    limits_formatted: formatTierLimits(t),
  }));

  return <AsesorProLanding product={product} tiers={tiers} />;
}
