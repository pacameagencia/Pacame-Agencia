"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Shield,
  BadgeCheck,
  RotateCcw,
  RefreshCw,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Clock,
  Loader2,
} from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Button } from "@/components/ui/button";

interface CheckoutStep3Props {
  data: {
    name: string;
    email: string;
    phone: string;
    company_name: string;
    company_sector: string;
    timeline: string;
  };
  serviceName: string;
  servicePrice: number;
  recurring?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export default function CheckoutStep3({
  data,
  serviceName,
  servicePrice,
  recurring,
  onBack,
  onConfirm,
  loading,
}: CheckoutStep3Props) {
  const formattedPrice =
    servicePrice > 0
      ? `${(servicePrice / 100).toLocaleString("es-ES")} EUR`
      : "A medida";

  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="mb-8">
        <h2 className="text-subsection font-heading text-pacame-white">
          Confirma tu pedido
        </h2>
        <p className="mt-2 text-sm font-body text-pacame-white/50">
          Revisa los datos antes de continuar al pago seguro.
        </p>
      </div>

      {/* Service Summary */}
      <div className="p-5 rounded-xl bg-white/[0.03] border border-olympus-gold/20 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-pacame-white/50 font-body">Servicio</p>
            <h3 className="text-lg font-heading font-semibold text-pacame-white mt-0.5">
              {serviceName}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xl font-heading font-bold text-olympus-gold">
              {formattedPrice}
            </span>
            {recurring && (
              <span className="flex items-center gap-1 mt-1 text-xs text-pacame-white/40 font-body justify-end">
                <RefreshCw className="w-3 h-3" />
                Pago mensual
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Summary */}
      <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <p className="text-xs font-body text-pacame-white/40 uppercase tracking-wider mb-3">
          Datos de contacto
        </p>
        <div className="space-y-2.5">
          <SummaryRow icon={<User className="w-4 h-4" />} label={data.name} />
          <SummaryRow icon={<Mail className="w-4 h-4" />} label={data.email} />
          {data.phone && (
            <SummaryRow
              icon={<Phone className="w-4 h-4" />}
              label={data.phone}
            />
          )}
        </div>
      </div>

      {/* Project Summary */}
      {(data.company_name || data.company_sector || data.timeline) && (
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
          <p className="text-xs font-body text-pacame-white/40 uppercase tracking-wider mb-3">
            Proyecto
          </p>
          <div className="space-y-2.5">
            {data.company_name && (
              <SummaryRow
                icon={<Building2 className="w-4 h-4" />}
                label={data.company_name}
              />
            )}
            {data.company_sector && (
              <SummaryRow
                icon={<Briefcase className="w-4 h-4" />}
                label={data.company_sector}
              />
            )}
            {data.timeline && (
              <SummaryRow
                icon={<Clock className="w-4 h-4" />}
                label={data.timeline}
              />
            )}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <ShinyButton
        className="w-full h-14 cursor-pointer"
        gradientFrom="#D4A853"
        gradientTo="#7C3AED"
        onClick={loading ? undefined : onConfirm}
      >
        <span className="flex items-center gap-2.5 px-6 py-3 text-base font-heading font-semibold text-pacame-white">
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Redirigiendo a pago seguro...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Ir a pago seguro
            </>
          )}
        </span>
      </ShinyButton>

      {/* Trust badges below */}
      <div className="flex items-center justify-center gap-4 mt-5">
        <TrustPill icon={<Shield className="w-3.5 h-3.5" />} label="SSL" />
        <TrustPill
          icon={<BadgeCheck className="w-3.5 h-3.5" />}
          label="Stripe Verified"
        />
        <TrustPill
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          label="15 dias garantia"
        />
      </div>

      {/* Back button */}
      <div className="mt-6 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={loading}
        >
          Volver al paso anterior
        </Button>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-pacame-white/30">{icon}</span>
      <span className="text-sm font-body text-pacame-white/80">{label}</span>
    </div>
  );
}

function TrustPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-pacame-white/30">
      {icon}
      <span className="text-xs font-body">{label}</span>
    </div>
  );
}
