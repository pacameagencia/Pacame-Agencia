"use client";

import { useState } from "react";

import {
  auditoriaSchema,
  BUDGET_LABEL,
  BUDGET_OPTIONS,
  PROBLEM_LABEL,
  PROBLEM_OPTIONS,
  SECTOR_LABEL,
  SECTOR_OPTIONS,
  TIMING_LABEL,
  TIMING_OPTIONS,
  type AuditoriaFormData,
  type BudgetOption,
  type ProblemOption,
  type SectorOption,
  type TimingOption,
} from "@/lib/storybook/auditoria-schema";
import { trackerSnapshot } from "@/lib/storybook/lead-tracker";

import ChipSelect from "./ChipSelect";

/**
 * Form auditoría 15 min — campos:
 *  - name (text)
 *  - email (email)
 *  - currentUrl (text, opcional)
 *  - sector (chip single, 8 opciones)
 *  - problem (chip multi, max 6)
 *  - budget (chip single, 5 opciones)
 *  - timing (chip single, 4 opciones)
 *  - website (honeypot, hidden)
 *  - caseSlug (pre-rellenado opcional desde ?case=)
 *
 * Submit:
 *  - Validación cliente con auditoria-schema.
 *  - POST a /api/leads con campos extra en sage_analysis_extra.
 *  - Manejo de error inline + estado success.
 *
 * A11y: labels asociadas, aria-live polite para errores, focus visible.
 */

interface AuditoriaFormProps {
  /** Slug de caso si llega via ?case=slug. Pre-rellena sector + problem si match. */
  prefillFromCase?: { sector?: SectorOption; problem?: ProblemOption[] } | null;
  caseSlug?: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function AuditoriaForm({
  prefillFromCase,
  caseSlug,
}: AuditoriaFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentUrl, setCurrentUrl] = useState("");
  const [sector, setSector] = useState<SectorOption | null>(
    prefillFromCase?.sector ?? null,
  );
  const [problem, setProblem] = useState<ProblemOption[]>(
    prefillFromCase?.problem ?? [],
  );
  const [budget, setBudget] = useState<BudgetOption | null>(null);
  const [timing, setTiming] = useState<TimingOption | null>(null);
  const [website, setWebsite] = useState(""); // honeypot

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});

    // Validación client-side
    const data: AuditoriaFormData = {
      name,
      email,
      currentUrl: currentUrl || undefined,
      sector: sector!,
      problem,
      budget: budget!,
      timing: timing!,
      website,
      caseSlug,
    };

    const parsed = auditoriaSchema.safeParse(data);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0] as string;
        if (path && !errors[path]) {
          errors[path] = issue.message;
        }
      }
      setFieldErrors(errors);
      setErrorMsg("Revisa los campos marcados.");
      return;
    }

    setStatus("submitting");
    try {
      const tracker = trackerSnapshot();
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          message: `Auditoría 15 min — ${PROBLEM_LABEL[parsed.data.problem[0] ?? "sin-web"]} (${SECTOR_LABEL[parsed.data.sector]})`,
          budget: BUDGET_LABEL[parsed.data.budget],
          // Campos extra van a sage_analysis del endpoint
          sage_analysis_extra: {
            audit_source: "storybook_v1",
            sector: parsed.data.sector,
            problem: parsed.data.problem,
            timing: parsed.data.timing,
            current_url: parsed.data.currentUrl || null,
            case_slug: parsed.data.caseSlug || null,
            islands_visited: tracker.islandsVisited,
            seconds_on_site: tracker.secondsOnSite,
          },
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-paper border border-terracotta-500/30 p-8 text-center">
        <div className="text-5xl mb-3">✓</div>
        <h3 className="font-display text-2xl font-bold text-ink mb-2">
          Recibida.
        </h3>
        <p className="text-ink/70 mb-1">
          Te escribo en 24h con tu auditoría personalizada.
        </p>
        <p className="text-sm text-ink/50">
          Mientras tanto, revisa tu email — ya te he enviado un resumen.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-paper/95 backdrop-blur-md border border-ink/10 shadow-xl shadow-ink/5 p-6 sm:p-8 space-y-6"
      noValidate
    >
      {/* Honeypot (hidden) */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
      />

      {/* Name + Email + URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1.5">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={status === "submitting"}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "err-name" : undefined}
            className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 ${
              fieldErrors.name ? "border-red-500" : "border-ink/20"
            }`}
            placeholder="Tu nombre"
          />
          {fieldErrors.name && (
            <p id="err-name" className="text-xs text-red-600 mt-1" aria-live="polite">
              {fieldErrors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "submitting"}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "err-email" : undefined}
            className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 ${
              fieldErrors.email ? "border-red-500" : "border-ink/20"
            }`}
            placeholder="tu@email.com"
          />
          {fieldErrors.email && (
            <p id="err-email" className="text-xs text-red-600 mt-1" aria-live="polite">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="url" className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1.5">
          Tu web actual <span className="text-ink/40 normal-case">(opcional)</span>
        </label>
        <input
          id="url"
          type="url"
          value={currentUrl}
          onChange={(e) => setCurrentUrl(e.target.value)}
          disabled={status === "submitting"}
          aria-invalid={!!fieldErrors.currentUrl}
          className={`w-full rounded-lg border bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 ${
            fieldErrors.currentUrl ? "border-red-500" : "border-ink/20"
          }`}
          placeholder="https://misitio.com"
        />
        {fieldErrors.currentUrl && (
          <p className="text-xs text-red-600 mt-1" aria-live="polite">
            {fieldErrors.currentUrl}
          </p>
        )}
      </div>

      {/* Sector */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">
          Sector
        </p>
        <ChipSelect
          options={SECTOR_OPTIONS}
          labelOf={(o) => SECTOR_LABEL[o]}
          value={sector}
          onChange={(v) => setSector(v as SectorOption)}
          mode="single"
          ariaLabel="Selecciona tu sector"
        />
        {fieldErrors.sector && (
          <p className="text-xs text-red-600 mt-1" aria-live="polite">
            {fieldErrors.sector}
          </p>
        )}
      </div>

      {/* Problem */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">
          Problema principal <span className="text-ink/40 normal-case">(elige varios)</span>
        </p>
        <ChipSelect
          options={PROBLEM_OPTIONS}
          labelOf={(o) => PROBLEM_LABEL[o]}
          value={problem}
          onChange={(v) => setProblem(v as ProblemOption[])}
          mode="multi"
          max={6}
          ariaLabel="Selecciona problemas principales"
        />
        {fieldErrors.problem && (
          <p className="text-xs text-red-600 mt-1" aria-live="polite">
            {fieldErrors.problem}
          </p>
        )}
      </div>

      {/* Budget */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">
          Presupuesto orientativo <span className="text-ink/40 normal-case">(€/mes)</span>
        </p>
        <ChipSelect
          options={BUDGET_OPTIONS}
          labelOf={(o) => BUDGET_LABEL[o]}
          value={budget}
          onChange={(v) => setBudget(v as BudgetOption)}
          mode="single"
          ariaLabel="Selecciona presupuesto"
        />
        {fieldErrors.budget && (
          <p className="text-xs text-red-600 mt-1" aria-live="polite">
            {fieldErrors.budget}
          </p>
        )}
      </div>

      {/* Timing */}
      <div>
        <p className="text-xs font-mono uppercase tracking-wider text-ink/60 mb-2">
          ¿Cuándo quieres empezar?
        </p>
        <ChipSelect
          options={TIMING_OPTIONS}
          labelOf={(o) => TIMING_LABEL[o]}
          value={timing}
          onChange={(v) => setTiming(v as TimingOption)}
          mode="single"
          ariaLabel="Selecciona timing"
        />
        {fieldErrors.timing && (
          <p className="text-xs text-red-600 mt-1" aria-live="polite">
            {fieldErrors.timing}
          </p>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-full bg-terracotta-500 px-6 py-4 text-base font-medium text-paper hover:bg-terracotta-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-terracotta-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper transition-all"
        >
          {status === "submitting" ? "Enviando…" : "Pide auditoría 15 min →"}
        </button>
        {errorMsg && (
          <p className="text-sm text-red-600 mt-3 text-center" aria-live="polite">
            {errorMsg}
          </p>
        )}
        <p className="text-xs text-ink/50 mt-3 text-center">
          Te respondo en 24h, sin compromiso.
        </p>
      </div>
    </form>
  );
}
