"use client";

import { useState } from "react";
import { CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";

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
  const [showCheckout, setShowCheckout] = useState(false);
  const mapping = serviceStripeMap[serviceName];

  if (!mapping) return null;

  const serviceSlug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  return (
    <>
      <Button
        variant={featured ? "gradient" : "outline"}
        size="sm"
        className={`group rounded-full ${featured && accentColor ? `border-[${accentColor}] text-[${accentColor}]` : ""}`}
        onClick={() => setShowCheckout(true)}
      >
        <CreditCard className="w-4 h-4" />
        Desde {mapping.amount}&nbsp;&euro;{mapping.recurring ? "/mes" : ""}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>

      <CheckoutFlow
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        serviceSlug={serviceSlug}
        serviceName={`${serviceName} — ${serviceCategory}`}
        servicePrice={mapping.amount}
        recurring={mapping.recurring}
        product={mapping.product}
      />
    </>
  );
}
