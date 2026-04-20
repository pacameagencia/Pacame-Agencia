"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Star,
  Users,
  RotateCcw,
  Headphones,
  CreditCard,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutSidebarProps {
  serviceName: string;
  servicePrice: number;
  recurring?: boolean;
  collapsed?: boolean;
}

export default function CheckoutSidebar({
  serviceName,
  servicePrice,
  recurring,
  collapsed = false,
}: CheckoutSidebarProps) {
  const formattedPrice =
    servicePrice > 0
      ? `${(servicePrice / 100).toLocaleString("es-ES")} EUR`
      : "A medida";

  return (
    <motion.aside
      className={cn(
        "rounded-2xl border border-ink/[0.08] bg-paper-deep p-6 space-y-6",
        collapsed && "lg:space-y-4"
      )}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Service + Price */}
      <div className="pb-5 border-b border-ink/[0.06]">
        <p className="text-sm text-ink/50 font-body mb-1">
          Tu servicio
        </p>
        <h3 className="text-lg font-heading font-semibold text-ink leading-tight">
          {serviceName}
        </h3>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl font-heading font-bold text-accent-gold">
            {formattedPrice}
          </span>
          {recurring && (
            <span className="text-xs text-ink/40 font-body">/mes</span>
          )}
        </div>
      </div>

      {/* Social Proof */}
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <Users className="w-5 h-5 text-accent-gold shrink-0" />
        <p className="text-sm font-body text-ink/70">
          <span className="text-ink font-semibold">47 empresas</span>{" "}
          confian en nosotros
        </p>
      </div>

      {/* Guarantee */}
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <RotateCcw className="w-5 h-5 text-mint shrink-0" />
        <p className="text-sm font-body text-ink/70">
          Garantia de devolucion{" "}
          <span className="text-ink font-semibold">15 dias</span>
        </p>
      </div>

      {/* Trust Badges */}
      <div className="space-y-2.5">
        <p className="text-xs text-ink/40 font-body uppercase tracking-wider">
          Pago 100% seguro
        </p>
        <div className="grid grid-cols-3 gap-2">
          <TrustBadge icon={<Lock className="w-4 h-4" />} label="SSL" />
          <TrustBadge
            icon={<BadgeCheck className="w-4 h-4" />}
            label="Stripe"
          />
          <TrustBadge icon={<Shield className="w-4 h-4" />} label="RGPD" />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-2.5">
        <p className="text-xs text-ink/40 font-body uppercase tracking-wider">
          Metodos de pago
        </p>
        <div className="flex flex-wrap gap-2">
          {["Visa", "Mastercard", "Apple Pay", "Google Pay", "Klarna"].map(
            (method) => (
              <span
                key={method}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-ink/[0.06] text-xs font-body text-ink/60"
              >
                {method}
              </span>
            )
          )}
        </div>
      </div>

      {/* Review */}
      <div className="relative p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <div className="flex gap-0.5 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5 fill-accent-gold text-accent-gold"
            />
          ))}
        </div>
        <p className="text-sm font-body text-ink/70 italic leading-relaxed">
          &ldquo;PACAME transformo nuestra presencia digital. En 2 semanas
          teniamos web, redes y leads entrando.&rdquo;
        </p>
        <p className="mt-2.5 text-xs font-body text-ink/40">
          <span className="text-ink/60 font-medium">Maria G.</span>
          {" "}
          — CEO TechStart
        </p>
      </div>

      {/* Support Badge */}
      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-brand-primary/[0.06] border border-brand-primary/[0.12]">
        <Headphones className="w-5 h-5 text-brand-primary shrink-0" />
        <p className="text-sm font-body text-ink/70">
          Soporte <span className="text-ink font-semibold">24/7</span>{" "}
          incluido
        </p>
      </div>
    </motion.aside>
  );
}

function TrustBadge({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
      <span className="text-accent-gold">{icon}</span>
      <span className="text-xs font-body text-ink/50">{label}</span>
    </div>
  );
}
