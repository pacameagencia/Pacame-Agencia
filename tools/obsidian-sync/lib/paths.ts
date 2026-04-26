import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Auto-resolve ROOT: este archivo está en `<ROOT>/tools/obsidian-sync/lib/paths.ts`,
// así que subiendo 3 niveles llegamos al root del repo. Funciona en local y VPS.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTO_ROOT = path.resolve(__dirname, '..', '..', '..');
const ROOT = process.env.PACAME_ROOT || AUTO_ROOT;

export const PATHS = {
  root: ROOT,
  vault: process.env.PACAME_VAULT || path.join(ROOT, 'PacameCueva'),
  sources: {
    agents: path.join(ROOT, 'agents'),
    subspecialists: path.join(ROOT, 'agency-agents'),
    workflows: path.join(ROOT, 'workflows'),
    strategy: path.join(ROOT, 'strategy'),
    skills: path.join(ROOT, '.claude', 'skills'),
    docs: path.join(ROOT, 'docs'),
    brand: path.join(ROOT, 'brand'),
  },
  vaultDirs: {
    dios: '00-Dios',
    agentes: '01-Agentes',
    subespecialistas: '02-Subespecialistas',
    skills: '03-Skills',
    workflows: '04-Workflows',
    strategy: '05-Strategy',
    clientes: '06-Clientes',
    sinapsis: '07-Sinapsis',
    memorias: '08-Memorias',
    discoveries: '09-Discoveries',
    proyectosPropios: '10-Proyectos-Propios',
    templates: '_templates',
    dashboards: '_dashboards',
  },
} as const;

export const AGENTS = [
  'DIOS', 'NOVA', 'ATLAS', 'NEXUS', 'PIXEL',
  'CORE', 'PULSE', 'SAGE', 'COPY', 'LENS',
] as const;
export type AgentCode = (typeof AGENTS)[number];
