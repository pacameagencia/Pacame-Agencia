import NoScriptContent from "@/components/storybook-3d/legacy-shell/NoScriptContent";
import SceneClient from "@/components/storybook-3d/SceneClient";

/**
 * Storybook 3D — Home V2 (Fase 1).
 *
 * Estructura:
 *   - SSR shell con `<NoScriptContent>` semántico (5 servicios → SEO).
 *   - Canvas R3F lazy-loaded vía SceneClient (Client Component con dynamic ssr:false).
 *   - Crawlers ven HTML real. Browsers cargan 3D después.
 *
 * En Fase 2 se añade HUD overlay + 5 islas + CTA persistente.
 */

export default function StorybookHome() {
  return (
    <main className="relative min-h-screen bg-paper text-ink overflow-hidden">
      {/* SSR content — siempre presente para crawlers + a11y + reduced-motion */}
      <NoScriptContent />

      {/* Canvas R3F — lazy, sin SSR. Cubre toda la viewport, fixed para scroll-driven */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ width: "100vw", height: "100vh" }}
      >
        <SceneClient />
      </div>

      {/* Espaciador scroll: ~6 viewports para que la cámara recorra los 6 keyframes */}
      <div aria-hidden="true" className="h-[600vh] pointer-events-none" />
    </main>
  );
}
