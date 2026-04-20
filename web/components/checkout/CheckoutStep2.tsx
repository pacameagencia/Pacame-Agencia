"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Globe,
  Briefcase,
  FileText,
  Target,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Step2Data {
  company_name: string;
  company_website: string;
  company_sector: string;
  project_description: string;
  project_objectives: string;
  timeline: string;
}

interface CheckoutStep2Props {
  data: Step2Data;
  onChange: (data: Step2Data) => void;
  onNext: () => void;
  onBack: () => void;
}

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors";

const LABEL_CLASS = "text-sm text-ink/70 font-body mb-2 block";

const SELECT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer";

const SECTORS = [
  "Tecnologia",
  "Salud",
  "Hosteleria",
  "Retail",
  "Servicios profesionales",
  "Educacion",
  "Inmobiliaria",
  "Otro",
];

const TIMELINES = [
  "Urgente (1 semana)",
  "1-2 semanas",
  "1 mes",
  "No tengo prisa",
];

export default function CheckoutStep2({
  data,
  onChange,
  onNext,
  onBack,
}: CheckoutStep2Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="mb-8">
        <h2 className="text-subsection font-heading text-ink">
          Tu proyecto
        </h2>
        <p className="mt-2 text-sm font-body text-ink/50">
          Cuanto mas nos cuentes, mejor personalizamos tu servicio. Todos los
          campos son opcionales.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Name */}
        <div>
          <label htmlFor="checkout-company" className={LABEL_CLASS}>
            Nombre de tu empresa
          </label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <input
              id="checkout-company"
              type="text"
              autoComplete="organization"
              placeholder="Mi Empresa S.L."
              value={data.company_name}
              onChange={(e) =>
                onChange({ ...data, company_name: e.target.value })
              }
              className={`${INPUT_CLASS} pl-11`}
            />
          </div>
        </div>

        {/* Company Website */}
        <div>
          <label htmlFor="checkout-website" className={LABEL_CLASS}>
            Web actual (si tienes)
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <input
              id="checkout-website"
              type="url"
              autoComplete="url"
              placeholder="https://miempresa.com"
              value={data.company_website}
              onChange={(e) =>
                onChange({ ...data, company_website: e.target.value })
              }
              className={`${INPUT_CLASS} pl-11`}
            />
          </div>
        </div>

        {/* Sector */}
        <div>
          <label htmlFor="checkout-sector" className={LABEL_CLASS}>
            Sector
          </label>
          <div className="relative">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <select
              id="checkout-sector"
              value={data.company_sector}
              onChange={(e) =>
                onChange({ ...data, company_sector: e.target.value })
              }
              className={`${SELECT_CLASS} pl-11 pr-10`}
            >
              <option value="" className="bg-paper-deep text-ink/50">
                Selecciona tu sector
              </option>
              {SECTORS.map((sector) => (
                <option
                  key={sector}
                  value={sector}
                  className="bg-paper-deep text-ink"
                >
                  {sector}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none" />
          </div>
        </div>

        {/* Project Description */}
        <div>
          <label htmlFor="checkout-description" className={LABEL_CLASS}>
            Describe tu proyecto en unas lineas
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 w-4 h-4 text-ink/20 pointer-events-none" />
            <textarea
              id="checkout-description"
              rows={3}
              placeholder="Necesitamos una web profesional para captar clientes..."
              value={data.project_description}
              onChange={(e) =>
                onChange({ ...data, project_description: e.target.value })
              }
              className={`${INPUT_CLASS} pl-11 resize-none`}
            />
          </div>
        </div>

        {/* Project Objectives */}
        <div>
          <label htmlFor="checkout-objectives" className={LABEL_CLASS}>
            Que objetivos quieres alcanzar?
          </label>
          <div className="relative">
            <Target className="absolute left-4 top-4 w-4 h-4 text-ink/20 pointer-events-none" />
            <textarea
              id="checkout-objectives"
              rows={3}
              placeholder="Generar leads, aumentar ventas, mejorar la marca..."
              value={data.project_objectives}
              onChange={(e) =>
                onChange({ ...data, project_objectives: e.target.value })
              }
              className={`${INPUT_CLASS} pl-11 resize-none`}
            />
          </div>
        </div>

        {/* Timeline */}
        <div>
          <label htmlFor="checkout-timeline" className={LABEL_CLASS}>
            Plazo deseado
          </label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 pointer-events-none" />
            <select
              id="checkout-timeline"
              value={data.timeline}
              onChange={(e) => onChange({ ...data, timeline: e.target.value })}
              className={`${SELECT_CLASS} pl-11 pr-10`}
            >
              <option value="" className="bg-paper-deep text-ink/50">
                Cuando lo necesitas?
              </option>
              {TIMELINES.map((tl) => (
                <option
                  key={tl}
                  value={tl}
                  className="bg-paper-deep text-ink"
                >
                  {tl}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 pointer-events-none" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onBack}
            className="px-6"
          >
            Atras
          </Button>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="flex-1"
          >
            Siguiente
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
