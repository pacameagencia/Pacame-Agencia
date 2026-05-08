import { z } from "zod/v4";

/**
 * Zod schema del form auditoría 3D. Compartido cliente + servidor.
 *
 * Reglas:
 *  - name: string min 2 (obligatorio)
 *  - email: z.email (obligatorio)
 *  - currentUrl: opcional, valida URL si presente
 *  - sector: chip select 8 opciones
 *  - problem: chip multi (array, max 6)
 *  - budget: chip 5 opciones
 *  - timing: chip 4 opciones
 *  - honeypot: campo hidden "website" — DEBE estar vacío. Bots lo rellenan.
 *
 * Backend: extiende /api/leads/route.ts (campos opcionales en sage_analysis
 * jsonb, sin migración nueva).
 */

export const SECTOR_OPTIONS = [
  "hosteleria",
  "retail",
  "salud",
  "servicios",
  "ecommerce",
  "b2b",
  "educacion",
  "otro",
] as const;

export const PROBLEM_OPTIONS = [
  "sin-web",
  "web-rota",
  "no-captamos-leads",
  "bajo-seo",
  "ads-no-rentan",
  "branding-debil",
] as const;

export const BUDGET_OPTIONS = [
  "<500",
  "500-1500",
  "1500-3000",
  "3000-5000",
  ">5000",
] as const;

export const TIMING_OPTIONS = [
  "ya",
  "este-mes",
  "3-meses",
  "explorando",
] as const;

export type SectorOption = (typeof SECTOR_OPTIONS)[number];
export type ProblemOption = (typeof PROBLEM_OPTIONS)[number];
export type BudgetOption = (typeof BUDGET_OPTIONS)[number];
export type TimingOption = (typeof TIMING_OPTIONS)[number];

export const auditoriaSchema = z.object({
  name: z
    .string()
    .min(2, "Tu nombre, por favor (al menos 2 caracteres)")
    .max(100),
  email: z.email("Email no válido"),
  currentUrl: z
    .string()
    .url("La URL debe ser válida (ej: https://misitio.com)")
    .optional()
    .or(z.literal("")),
  sector: z.enum(SECTOR_OPTIONS),
  problem: z.array(z.enum(PROBLEM_OPTIONS)).min(1, "Elige al menos 1 problema").max(6),
  budget: z.enum(BUDGET_OPTIONS),
  timing: z.enum(TIMING_OPTIONS),
  // Honeypot anti-bot: debe estar vacío
  website: z.string().max(0, "Bot detectado").optional().default(""),
  // Pre-rellenado opcional desde ?case=slug
  caseSlug: z.string().max(80).optional(),
});

export type AuditoriaFormData = z.infer<typeof auditoriaSchema>;

/** Mapeo budget UI → string que /api/leads usa para scoring. */
export const BUDGET_LABEL: Record<BudgetOption, string> = {
  "<500": "<500€",
  "500-1500": "500-1500€",
  "1500-3000": "1500-3000€",
  "3000-5000": "3000-5000€",
  ">5000": ">5000€",
};

export const SECTOR_LABEL: Record<SectorOption, string> = {
  hosteleria: "Hostelería",
  retail: "Retail",
  salud: "Salud",
  servicios: "Servicios",
  ecommerce: "E-commerce",
  b2b: "B2B",
  educacion: "Educación",
  otro: "Otro",
};

export const PROBLEM_LABEL: Record<ProblemOption, string> = {
  "sin-web": "Sin web",
  "web-rota": "Web rota",
  "no-captamos-leads": "No captamos leads",
  "bajo-seo": "Bajo SEO",
  "ads-no-rentan": "Ads no rentan",
  "branding-debil": "Branding débil",
};

export const TIMING_LABEL: Record<TimingOption, string> = {
  ya: "Ya",
  "este-mes": "Este mes",
  "3-meses": "Próximos 3 meses",
  explorando: "Explorando",
};
