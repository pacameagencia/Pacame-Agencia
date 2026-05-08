"use client";

/**
 * Lead tracker para Storybook 3D — registra interacciones del usuario
 * en localStorage para disparar email-prompt progresivo (Fase 4) y
 * enriquecer los leads con contexto comportamental (Fase 5).
 *
 * Storage: clave única `pacame_storybook_v1` con JSON con:
 *  - islandsVisited: lista de slugs visitados (set serializado).
 *  - secondsOnSite: tiempo total (acumulado entre sesiones).
 *  - sessionStartedAt: ISO de cuándo empezó esta sesión.
 *  - emailPromptShownAt: ISO de cuándo se mostró prompt (null si no).
 *  - emailCaptured: email si ya capturado, null si no.
 *  - lastInteractionAt: ISO de última actualización.
 *
 * NO contiene PII salvo el email capturado. Pablo puede pedir borrarlo.
 *
 * Privacidad: solo lectura cliente. No se sincroniza con Supabase salvo
 * cuando el user envía el form auditoría (entonces va en sage_analysis).
 */

import type { IslandSlug } from "./content";

const STORAGE_KEY = "pacame_storybook_v1";

export interface LeadTrackerState {
  islandsVisited: IslandSlug[];
  secondsOnSite: number;
  sessionStartedAt: string;
  emailPromptShownAt: string | null;
  emailCaptured: string | null;
  lastInteractionAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptyState(): LeadTrackerState {
  const now = nowIso();
  return {
    islandsVisited: [],
    secondsOnSite: 0,
    sessionStartedAt: now,
    emailPromptShownAt: null,
    emailCaptured: null,
    lastInteractionAt: now,
  };
}

export function loadTrackerState(): LeadTrackerState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<LeadTrackerState>;
    return {
      ...emptyState(),
      ...parsed,
      // Coerciones por si el formato cambia
      islandsVisited: Array.isArray(parsed.islandsVisited)
        ? (parsed.islandsVisited as IslandSlug[])
        : [],
    };
  } catch {
    return emptyState();
  }
}

export function saveTrackerState(state: LeadTrackerState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // QuotaExceeded o storage denied (incógnito): silenciar
  }
}

/** Marca una isla como visitada. Idempotente. */
export function markIslandVisited(slug: IslandSlug): LeadTrackerState {
  const state = loadTrackerState();
  if (!state.islandsVisited.includes(slug)) {
    state.islandsVisited.push(slug);
  }
  state.lastInteractionAt = nowIso();
  saveTrackerState(state);
  return state;
}

/** Suma segundos al tiempo total. Llamar desde un setInterval(1000ms). */
export function tickSecondsOnSite(): LeadTrackerState {
  const state = loadTrackerState();
  state.secondsOnSite += 1;
  state.lastInteractionAt = nowIso();
  saveTrackerState(state);
  return state;
}

/** Guarda email capturado tras submit del prompt. */
export function setEmailCaptured(email: string): void {
  const state = loadTrackerState();
  state.emailCaptured = email;
  state.lastInteractionAt = nowIso();
  saveTrackerState(state);
}

/** Marca que el prompt se mostró (para no spamear). */
export function markEmailPromptShown(): void {
  const state = loadTrackerState();
  state.emailPromptShownAt = nowIso();
  state.lastInteractionAt = nowIso();
  saveTrackerState(state);
}

/**
 * Decide si mostrar el prompt:
 *  - 3+ islas visitadas O 60s+ en sitio
 *  - Y prompt aún no mostrado
 *  - Y email aún no capturado
 */
export function shouldShowEmailPrompt(state: LeadTrackerState): boolean {
  if (state.emailCaptured) return false;
  if (state.emailPromptShownAt) return false;
  if (state.islandsVisited.length >= 3) return true;
  if (state.secondsOnSite >= 60) return true;
  return false;
}

/** Snapshot serializable para enviar al endpoint /api/leads. */
export function trackerSnapshot(): {
  islandsVisited: string[];
  secondsOnSite: number;
  sessionStartedAt: string;
} {
  const state = loadTrackerState();
  return {
    islandsVisited: state.islandsVisited,
    secondsOnSite: state.secondsOnSite,
    sessionStartedAt: state.sessionStartedAt,
  };
}
