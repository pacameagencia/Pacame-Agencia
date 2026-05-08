"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { ISLAND_ORDER, type IslandSlug } from "@/lib/storybook/content";

/**
 * Estado compartido entre Scene 3D y HUD overlay.
 *
 * Diseño:
 *  - `progress` 0..1 viene de Lenis (use-scroll-progress en Scene).
 *  - `activeIsland` se calcula en el provider en función de `progress` por
 *    derivación pura (no almacenado), para evitar re-renders innecesarios.
 *  - `setProgress` lo llama Scene en su useFrame. Throttled internamente
 *    para no saturar el HUD (cada 50ms basta, el HUD no necesita 60fps).
 *  - `setActiveIslandManually(slug)`: usado por click en isla / atajo
 *    teclado / ProgressIndicator dot. Activa override hasta que el user
 *    suelte el scroll (la cámara va al keyframe correspondiente).
 *  - `clearOverride()`: lo llama Scene cuando detecta scroll del usuario.
 */

interface IslandStateValue {
  /** Scroll progress 0..1 (Lenis). */
  progress: number;
  /** Isla activa según progress (o override manual). */
  activeIsland: IslandSlug | null;
  /** Si hay override por click/teclado, este es el slug forzado. */
  overrideIsland: IslandSlug | null;
  /** Setter para Scene → throttled internamente. */
  setProgress: (p: number) => void;
  /** Forzar una isla activa (click HUD / teclado). Devuelve el progress
   *  asociado al keyframe correspondiente (para anclar la cámara). */
  setActiveIslandManually: (slug: IslandSlug) => number;
  /** Cancelar override (cuando el usuario hace scroll). */
  clearOverride: () => void;
  /** Lista de islas ya visitadas (para email-prompt en Fase 4). */
  visitedIslands: ReadonlySet<IslandSlug>;
}

const IslandStateContext = createContext<IslandStateValue | null>(null);

const PROGRESS_THROTTLE_MS = 50;

/**
 * Mapea progress 0..1 → isla activa según la distribución de keyframes:
 *  - 0.00 → null (overview)
 *  - 0.20 → web
 *  - 0.40 → seo
 *  - 0.60 → redes
 *  - 0.80 → ads
 *  - 1.00 → branding
 *
 * Cada isla "domina" cuando progress está en su segmento (±10% tolerancia).
 */
function computeActiveIsland(progress: number): IslandSlug | null {
  // Overview ocupa progress < 0.10
  if (progress < 0.1) return null;
  // Cada isla ocupa un segmento de 0.20, centrado en su keyframe
  // web: 0.10..0.30, seo: 0.30..0.50, redes: 0.50..0.70,
  // ads: 0.70..0.90, branding: 0.90..1.00
  if (progress < 0.3) return "web";
  if (progress < 0.5) return "seo";
  if (progress < 0.7) return "redes";
  if (progress < 0.9) return "ads";
  return "branding";
}

/**
 * Devuelve el progress asociado al centro del segmento de una isla.
 * Útil para hacer scroll programático cuando el usuario clica una isla.
 */
export function progressForIsland(slug: IslandSlug): number {
  const idx = ISLAND_ORDER.indexOf(slug);
  // Distribución uniforme: web=0.20, seo=0.40, redes=0.60, ads=0.80, branding=1.00
  return (idx + 1) / ISLAND_ORDER.length;
}

export function IslandStateProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressRaw] = useState(0);
  const [overrideIsland, setOverrideIsland] = useState<IslandSlug | null>(null);
  const [visitedIslands, setVisitedIslands] = useState<Set<IslandSlug>>(
    () => new Set(),
  );
  const lastUpdateRef = useRef(0);

  const setProgress = useCallback((p: number) => {
    const now = performance.now();
    if (now - lastUpdateRef.current < PROGRESS_THROTTLE_MS) return;
    lastUpdateRef.current = now;
    setProgressRaw(p);

    // Marcar como visitada la isla actual (si no es null)
    const current = computeActiveIsland(p);
    if (current) {
      setVisitedIslands((prev) => {
        if (prev.has(current)) return prev;
        const next = new Set(prev);
        next.add(current);
        return next;
      });
    }
  }, []);

  const setActiveIslandManually = useCallback((slug: IslandSlug): number => {
    setOverrideIsland(slug);
    setVisitedIslands((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      return next;
    });
    return progressForIsland(slug);
  }, []);

  const clearOverride = useCallback(() => {
    setOverrideIsland(null);
  }, []);

  const activeIsland = useMemo(
    () => overrideIsland ?? computeActiveIsland(progress),
    [overrideIsland, progress],
  );

  const value = useMemo<IslandStateValue>(
    () => ({
      progress,
      activeIsland,
      overrideIsland,
      setProgress,
      setActiveIslandManually,
      clearOverride,
      visitedIslands,
    }),
    [
      progress,
      activeIsland,
      overrideIsland,
      setProgress,
      setActiveIslandManually,
      clearOverride,
      visitedIslands,
    ],
  );

  return (
    <IslandStateContext.Provider value={value}>
      {children}
    </IslandStateContext.Provider>
  );
}

export function useIslandState(): IslandStateValue {
  const ctx = useContext(IslandStateContext);
  if (!ctx) {
    throw new Error("useIslandState debe usarse dentro de <IslandStateProvider>");
  }
  return ctx;
}
