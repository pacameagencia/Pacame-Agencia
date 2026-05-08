import HUD from "@/components/storybook-3d/HUD";
import NoScriptContent from "@/components/storybook-3d/legacy-shell/NoScriptContent";
import ReducedMotionFallback from "@/components/storybook-3d/ReducedMotionFallback";
import ReducedMotionToggle from "@/components/storybook-3d/ReducedMotionToggle";
import SceneClient from "@/components/storybook-3d/SceneClient";
import { IslandStateProvider } from "@/lib/storybook/island-state";

/**
 * Storybook 3D — Home V2 (Fase 2).
 *
 * Estructura:
 *   - SSR shell con `<NoScriptContent>` semántico (5 servicios → SEO).
 *   - Canvas R3F lazy-loaded vía SceneClient con 5 islas reales.
 *   - HUD overlay (CTA, ProgressIndicator, ActiveIslandLabel, AccessibleNav).
 *   - ReducedMotionFallback automático si user prefiere reduced motion.
 *   - Todo dentro de IslandStateProvider para sincronizar Scene ↔ HUD.
 *
 * Crawlers ven HTML real (NoScriptContent). Browsers cargan 3D después.
 *
 * Espaciador scroll: ~6 viewports para que la cámara recorra los 6 keyframes
 * (overview + 5 islas) con Lenis como fuente única de progress.
 */

export default function StorybookHome() {
  return (
    <IslandStateProvider>
      <main className="relative min-h-screen bg-paper text-ink overflow-hidden">
        {/* SSR semántico — siempre presente para crawlers + a11y screen readers */}
        <NoScriptContent />

        {/* Canvas R3F — lazy, fixed full-viewport, sin pointer-events globales
            (las islas tienen pointer-events propio para click/hover) */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10"
          style={{ width: "100vw", height: "100vh" }}
        >
          <SceneClient />
        </div>

        {/* HUD overlay — CTA, indicators, labels, nav */}
        <HUD />

        {/* Reduced-motion fallback (auto) */}
        <ReducedMotionFallback />

        {/* Toggle persistente "3D on/off" en esquina inferior izquierda */}
        <ReducedMotionToggle />

        {/* Espaciador scroll: 6 viewports para los 6 keyframes */}
        <div aria-hidden="true" className="h-[600vh] pointer-events-none" />
      </main>
    </IslandStateProvider>
  );
}
