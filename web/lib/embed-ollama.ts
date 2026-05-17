/**
 * @deprecated Sprint v0.10.29 (2026-05-17)
 *
 * Este módulo ha sido REEMPLAZADO por `embed-openai.ts` (OpenAI
 * text-embedding-3-large). Lo dejamos como shim que re-exporta el API nuevo
 * para no romper imports legacy mientras hacemos sweep total.
 *
 * Razón del cambio:
 *  - Ollama (nomic-embed-text) corría en VPS Hostinger consumiendo 2-4GB RAM
 *  - Bloqueaba migración a VPS Contabo Cloud VPS 10 (8GB) — necesitábamos VPS 20 (12GB)
 *  - 2026: OpenAI text-embedding-3-large es mejor calidad y cuesta <€0,05/mes
 *
 * Migración para callers:
 *   - Antes: `import { embed } from "@/lib/embed-ollama"`
 *   - Después: `import { embed } from "@/lib/embed-openai"`
 *
 * Plan de retirada:
 *   - v0.10.29 (esta PR): shim deprecado, API compatible
 *   - v0.10.30+: borrar el shim cuando todos los call sites estén migrados
 */

export {
  embed,
  embedBatch,
  toPgVector,
  modelInfo,
} from "./embed-openai";
export type { EmbedResult } from "./embed-openai";
