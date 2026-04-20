"use client";

import { motion } from "framer-motion";
import { User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Step1Data {
  name: string;
  email: string;
  phone: string;
}

interface CheckoutStep1Props {
  data: Step1Data;
  onChange: (data: Step1Data) => void;
  onNext: () => void;
}

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors";

const LABEL_CLASS = "text-sm text-ink/70 font-body mb-2 block";

export default function CheckoutStep1({
  data,
  onChange,
  onNext,
}: CheckoutStep1Props) {
  const isValid = data.name.trim().length > 0 && isValidEmail(data.email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) onNext();
  }

  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="mb-8">
        <h2 className="text-subsection font-heading text-ink">
          Cuentanos sobre ti
        </h2>
        <p className="mt-2 text-sm font-body text-ink/50">
          Necesitamos algunos datos para personalizar tu experiencia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="checkout-name" className={LABEL_CLASS}>
            Nombre completo <span className="text-accent-burgundy-soft">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <input
              id="checkout-name"
              type="text"
              required
              autoComplete="name"
              placeholder="Pablo Calleja"
              value={data.name}
              onChange={(e) => onChange({ ...data, name: e.target.value })}
              className={`${INPUT_CLASS} pl-11`}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="checkout-email" className={LABEL_CLASS}>
            Email profesional <span className="text-accent-burgundy-soft">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <input
              id="checkout-email"
              type="email"
              required
              autoComplete="email"
              placeholder="hola@tuempresa.com"
              value={data.email}
              onChange={(e) => onChange({ ...data, email: e.target.value })}
              className={`${INPUT_CLASS} pl-11`}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="checkout-phone" className={LABEL_CLASS}>
            Telefono{" "}
            <span className="text-ink/30 font-normal">
              (recomendado)
            </span>
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <input
              id="checkout-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+34 600 000 000"
              value={data.phone}
              onChange={(e) => onChange({ ...data, phone: e.target.value })}
              className={`${INPUT_CLASS} pl-11`}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            disabled={!isValid}
            className="w-full"
          >
            Siguiente
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
