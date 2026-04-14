"use client";

import CheckoutButton from "@/components/CheckoutButton";

// Map service items to Stripe products and starting prices
const serviceStripeMap: Record<string, { product: string; amount: number; recurring: boolean }> = {
  "Landing Page": { product: "landing", amount: 300, recurring: false },
  "Web Corporativa": { product: "web", amount: 800, recurring: false },
  "Web Premium": { product: "custom", amount: 1500, recurring: false },
  "E-commerce": { product: "custom", amount: 2000, recurring: false },
  "App Web / SaaS": { product: "custom", amount: 5000, recurring: false },
  "Auditoría SEO": { product: "custom", amount: 300, recurring: false },
  "SEO Mensual Básico": { product: "seo_monthly", amount: 400, recurring: true },
  "SEO Premium": { product: "seo_monthly", amount: 800, recurring: true },
  "Plan Starter": { product: "social_monthly", amount: 300, recurring: true },
  "Plan Growth": { product: "social_monthly", amount: 500, recurring: true },
  "Plan Scale": { product: "social_monthly", amount: 800, recurring: true },
  "Setup de Campaña": { product: "custom", amount: 500, recurring: false },
  "Gestión Meta Ads": { product: "custom", amount: 400, recurring: true },
  "Embudo Completo": { product: "custom", amount: 1500, recurring: false },
  "Logo + Identidad Básica": { product: "custom", amount: 400, recurring: false },
  "Branding Completo": { product: "custom", amount: 800, recurring: false },
  "Rebranding": { product: "custom", amount: 1200, recurring: false },
};

interface Props {
  serviceName: string;
  serviceCategory: string;
  featured?: boolean;
  accentColor?: string;
}

export default function ServiceCheckoutButton({ serviceName, serviceCategory, featured, accentColor }: Props) {
  const mapping = serviceStripeMap[serviceName];

  if (!mapping) return null;

  return (
    <CheckoutButton
      product={mapping.product}
      amount={mapping.amount}
      recurring={mapping.recurring}
      label={`Desde ${mapping.amount}\u00A0\u20AC${mapping.recurring ? "/mes" : ""}`}
      description={`${serviceName} — ${serviceCategory}`}
      variant="outline"
      size="sm"
      className={featured && accentColor ? `border-[${accentColor}] text-[${accentColor}]` : ""}
    />
  );
}
