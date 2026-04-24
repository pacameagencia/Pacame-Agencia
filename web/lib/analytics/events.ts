/**
 * Events tracking — wrapper unificado GA4 + posthog/plausible opcional.
 *
 * Uso:
 *   import { trackEvent, trackCta, trackFormStart, trackFormSubmit } from "@/lib/analytics/events";
 *   trackCta("reservar_slot", "hero");
 *   trackFormStart("checkout");
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, event: string, params?: EventParams) => void;
    posthog?: {
      capture: (event: string, params?: EventParams) => void;
    };
  }
}

/**
 * Core tracker. No-op si no hay ventana (SSR) o ningun provider presente.
 */
export function trackEvent(event: string, params?: EventParams): void {
  if (typeof window === "undefined") return;

  const safe = sanitize(params);

  try {
    window.gtag?.("event", event, safe);
  } catch {
    /* ignore */
  }

  try {
    window.posthog?.capture(event, safe);
  } catch {
    /* ignore */
  }

  // Debug log en dev
  if (process.env.NODE_ENV === "development") {
    console.log("[track]", event, safe);
  }
}

/**
 * Remove null/undefined + limit string length para evitar payload bloat en GA4.
 */
function sanitize(params?: EventParams): EventParams {
  if (!params) return {};
  const out: EventParams = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    if (typeof v === "string") {
      out[k] = v.slice(0, 500);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Helpers tipados para eventos comunes

export function trackCta(label: string, location: string, extras?: EventParams): void {
  trackEvent("cta_click", {
    cta_label: label,
    cta_location: location,
    ...extras,
  });
}

export function trackFormStart(formName: string): void {
  trackEvent("form_start", { form_name: formName });
}

export function trackFormFieldComplete(formName: string, fieldName: string): void {
  trackEvent("form_field_complete", {
    form_name: formName,
    field_name: fieldName,
  });
}

export function trackFormSubmit(formName: string, success: boolean): void {
  trackEvent(success ? "form_submit_success" : "form_submit_error", {
    form_name: formName,
  });
}

export function trackFormAbandon(formName: string, lastField?: string): void {
  trackEvent("form_abandon", {
    form_name: formName,
    last_field: lastField,
  });
}

export function trackQuizStep(step: number, answer?: string): void {
  trackEvent("quiz_step_complete", {
    step,
    answer,
  });
}

export function trackToolUsed(toolSlug: string, success: boolean): void {
  trackEvent("tool_used", {
    tool_slug: toolSlug,
    success,
  });
}

export function trackVariantAssigned(testName: string, variant: string): void {
  trackEvent("ab_variant_assigned", {
    test_name: testName,
    variant,
  });
}

export function trackScarcityViewed(month: string, slotsLeft: number): void {
  trackEvent("scarcity_viewed", {
    month,
    slots_left: slotsLeft,
  });
}
