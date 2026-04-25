import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, formatTierLimits } from "@/lib/products/registry";
import ProductLanding from "./ProductLanding";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product: id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Producto no encontrado · PACAME" };
  return {
    title: `${product.name} · ${product.tagline} — PACAME`,
    description:
      product.marketing.hero_sub ?? product.tagline,
    alternates: { canonical: `https://pacameagencia.com/p/${id}` },
    openGraph: {
      title: `${product.name} · PACAME`,
      description: product.marketing.hero_headline ?? product.tagline,
      url: `https://pacameagencia.com/p/${id}`,
      type: "website",
    },
  };
}

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product: id } = await params;
  const product = await getProduct(id);
  if (!product || !["live", "beta"].includes(product.status)) notFound();

  const tiersWithLimits = product.pricing.map((t) => ({
    ...t,
    limits_formatted: formatTierLimits(t),
  }));

  return <ProductLanding product={product} tiers={tiersWithLimits} />;
}
