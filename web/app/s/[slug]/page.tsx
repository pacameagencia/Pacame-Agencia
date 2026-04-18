import type { Metadata } from "next";
import { notFound } from "next/navigation";

// ISR: short-link landing — 1h cache
export const revalidate = 3600;

import {
  getSalesPage,
  getAllSalesPageSlugs,
} from "@/lib/data/sales-pages";
import {
  testimonials,
  getTestimonialsByService,
} from "@/lib/data/testimonials";
import SalesPageClient from "./SalesPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSalesPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSalesPage(slug);
  if (!page) return {};

  return {
    title: `${page.serviceName} — PACAME Agencia Digital`,
    description: page.subheadline.slice(0, 155),
    alternates: { canonical: `https://pacameagencia.com/s/${slug}` },
    openGraph: {
      title: page.headline,
      description: page.subheadline.slice(0, 155),
      url: `https://pacameagencia.com/s/${slug}`,
      siteName: "PACAME",
      type: "website",
      locale: "es_ES",
    },
  };
}

export default async function SalesPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSalesPage(slug);
  if (!page) notFound();

  const relevantTestimonials = getTestimonialsByService(page.serviceSlug);
  const displayTestimonials =
    relevantTestimonials.length >= 2
      ? relevantTestimonials
      : testimonials.slice(0, 4);

  return (
    <SalesPageClient
      page={page}
      testimonials={displayTestimonials}
    />
  );
}
