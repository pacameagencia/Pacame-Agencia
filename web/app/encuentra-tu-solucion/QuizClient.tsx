"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Utensils,
  Bed,
  Stethoscope,
  Dumbbell,
  Home as HomeIcon,
  ShoppingBag,
  GraduationCap,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  Layers,
  CircleDashed,
  type LucideIcon,
} from "lucide-react";
import type { QuizAnswers } from "@/lib/finder/rules";

const STORAGE_KEY = "pacame_quiz_v1";

interface OptionCard {
  value: string;
  label: string;
  desc?: string;
  icon?: LucideIcon | string;
}

const SECTORS: OptionCard[] = [
  { value: "restaurante", label: "Restaurante", desc: "Bar, cafeteria, food truck", icon: Utensils },
  { value: "hotel", label: "Hotel", desc: "Boutique, hostel, apartamentos", icon: Bed },
  { value: "clinica", label: "Clinica", desc: "Medica, dental, fisio", icon: Stethoscope },
  { value: "gym", label: "Gym / Fitness", desc: "Gym, PT, CrossFit box", icon: Dumbbell },
  { value: "inmobiliaria", label: "Inmobiliaria", desc: "Agencia, Airbnb, promotor", icon: HomeIcon },
  { value: "ecommerce", label: "Ecommerce", desc: "Tienda DTC, dropshipping", icon: ShoppingBag },
  { value: "formacion", label: "Formacion", desc: "Academia, coach, universidad", icon: GraduationCap },
  { value: "saas", label: "SaaS", desc: "Early-stage, Serie A-B, Enterprise", icon: Zap },
  { value: "otro", label: "Otro sector", desc: "Te hacemos web a medida", icon: CircleDashed },
];

const SIZES: OptionCard[] = [
  { value: "solo", label: "Solo / Freelance", desc: "Sin equipo interno" },
  { value: "small", label: "Pequeno (<5 personas)", desc: "Arrancando / familiar" },
  { value: "medium", label: "Mediano (5-20)", desc: "Estructura establecida" },
  { value: "large", label: "Grande (20+)", desc: "Multi-ubicacion o scaleup" },
];

const GOALS: OptionCard[] = [
  { value: "mas-leads", label: "Capturar mas leads", desc: "Aumentar trafico cualificado", icon: TrendingUp },
  { value: "mejor-conversion", label: "Convertir mejor", desc: "Que el trafico actual rinda mas", icon: Target },
  { value: "ahorrar-tiempo", label: "Ahorrar tiempo operativo", desc: "Automatizar tareas manuales", icon: Clock },
  { value: "expandir-canales", label: "Expandir a mas canales", desc: "Social, email, busqueda", icon: Layers },
  { value: "todo-en-uno", label: "Sistema todo-en-uno", desc: "Base completa digital", icon: Sparkles },
];

const BUDGETS: OptionCard[] = [
  { value: "low", label: "< 500€", desc: "Un servicio puntual" },
  { value: "mid", label: "500 - 2.000€", desc: "Bundle medio" },
  { value: "high", label: "2.000 - 10.000€", desc: "Solucion completa" },
  { value: "enterprise", label: "10.000+ €", desc: "Multi-producto + custom" },
];

const URGENCIES: OptionCard[] = [
  { value: "urgent", label: "Urgente — esta semana", desc: "Lo necesito ya" },
  { value: "1-month", label: "En 1 mes", desc: "Tengo lanzamiento" },
  { value: "3-months", label: "En 3 meses", desc: "Planificando Q proximo" },
  { value: "exploring", label: "Explorando opciones", desc: "Curioseando el mercado" },
];

const STEPS = [
  { key: "sector", title: "¿Cual es tu sector?", options: SECTORS, cols: 3 },
  { key: "size", title: "¿De que tamano es tu negocio?", options: SIZES, cols: 2 },
  { key: "goal", title: "¿Cual es tu objetivo #1?", options: GOALS, cols: 1 },
  { key: "budget", title: "¿Que presupuesto manejas?", options: BUDGETS, cols: 2 },
  { key: "urgency", title: "¿Cuando lo necesitas?", options: URGENCIES, cols: 2 },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export default function QuizClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.step === "number") setStep(parsed.step);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist to sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers }));
  }, [step, answers]);

  const current = STEPS[step];
  const currentValue = answers[current.key as StepKey];
  const progressPct = useMemo(
    () => Math.round(((step + 1) / STEPS.length) * 100),
    [step]
  );

  function handleSelect(value: string) {
    setAnswers((a) => ({ ...a, [current.key]: value }));
    // Auto-advance after 200ms delay for visual feedback
    setTimeout(() => {
      if (step < STEPS.length - 1) {
        setStep(step + 1);
      }
    }, 220);
  }

  async function handleSubmit() {
    if (!answers.sector || !answers.size || !answers.goal || !answers.budget || !answers.urgency) {
      setError("Por favor responde todas las preguntas");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/finder/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
      // Clear sessionStorage
      sessionStorage.removeItem(STORAGE_KEY);
      // Navigate to result page
      router.push(`/encuentra-tu-solucion/${json.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setSubmitting(false);
    }
  }

  const isLast = step === STEPS.length - 1;
  const allAnswered = Object.keys(answers).length === STEPS.length;

  return (
    <main className="min-h-screen bg-paper pb-24">
      {/* Header with chrono + progress */}
      <div className="sticky top-0 z-20 bg-paper/90 backdrop-blur-md border-b border-ink/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-baseline justify-between mb-3 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">
            <span className="text-accent-gold">Quiz · 2 min</span>
            <span className="hidden md:inline">Smart Service Finder</span>
            <span>
              Paso {step + 1} / {STEPS.length}
            </span>
          </div>
          <div className="h-1 bg-ink/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-gold transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20">
        {/* Question */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-ink/45 mb-5">
            <span className="text-accent-gold">§ {String(step + 1).padStart(2, "0")}</span>
            <span className="h-px w-8 bg-ink/20" />
            <span>Pregunta {step + 1}</span>
          </div>
          <h1 className="font-heading font-bold text-[clamp(1.75rem,4vw,3rem)] text-ink leading-[1.05] tracking-[-0.025em]">
            {current.title.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="font-accent italic font-normal text-accent-gold">
              {current.title.split(" ").slice(-1)[0]}
            </span>
          </h1>
        </div>

        {/* Options grid */}
        <div
          className={`grid gap-3 ${
            current.cols === 1
              ? "grid-cols-1"
              : current.cols === 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-2 md:grid-cols-3"
          }`}
        >
          {current.options.map((opt) => {
            const Icon = typeof opt.icon === "function" ? opt.icon : null;
            const isSelected = currentValue === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`group text-left p-5 md:p-6 rounded-2xl border transition-all ${
                  isSelected
                    ? "border-accent-gold bg-accent-gold/10 ring-2 ring-accent-gold/30"
                    : "border-ink/[0.08] hover:border-accent-gold/40 bg-ink/[0.02] hover:bg-ink/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  {Icon ? (
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-accent-gold/20 text-accent-gold"
                          : "bg-ink/[0.04] text-ink/60 group-hover:bg-accent-gold/10 group-hover:text-accent-gold"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10" />
                  )}
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-accent-gold flex items-center justify-center">
                      <Check className="w-3 h-3 text-paper" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="font-heading font-semibold text-[15px] md:text-[16px] text-ink mb-1 leading-tight">
                  {opt.label}
                </div>
                {opt.desc && (
                  <div className="text-[12px] md:text-[13px] text-ink/55 font-body leading-snug">
                    {opt.desc}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            className="mt-6 p-4 rounded-xl bg-accent-burgundy/10 border border-accent-burgundy/30 text-accent-burgundy text-[13px]"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-heading font-medium text-[14px] text-ink/55 hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-4 h-4" /> Atras
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-accent-gold text-paper font-heading font-semibold text-[15px] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition shadow-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Calculando...
                </>
              ) : (
                <>
                  Ver mi recomendacion <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!currentValue}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ink/[0.04] border border-ink/[0.08] text-ink font-heading font-medium text-[14px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/[0.06] transition"
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer microcopy */}
        <p className="mt-12 text-center text-[12px] text-ink/40 font-body">
          Sin spam. Sin cuentas creadas. Te recomendamos el bundle exacto que
          necesitas segun tus 5 respuestas.{" "}
          <Link href="/portafolio" className="text-ink/60 underline underline-offset-2 hover:text-accent-gold">
            O ve el indice completo
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
