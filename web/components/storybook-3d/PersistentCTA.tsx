"use client";

import Link from "next/link";

import { CTA_HREF, CTA_LABEL } from "@/lib/storybook/content";

/**
 * CTA persistente — único en toda la home Storybook 3D.
 *
 * Posicionamiento:
 *  - Desktop: fixed bottom-6 right-6 (no obstrusivo).
 *  - Mobile:  fixed bottom-4, centrado horizontalmente, full-width-ish.
 *
 * Carácter: terracota mate (no glossy, no gradient random), tipografía
 * Fraunces para coherencia con resto del HUD.
 *
 * Accesibilidad: focus visible, contraste WCAG AA verificado contra el
 * canvas dinámico (pill background sólido).
 */
export default function PersistentCTA() {
  return (
    <Link
      href={CTA_HREF}
      className="
        group fixed z-40 inline-flex items-center justify-center gap-2
        rounded-full bg-terracotta-500 text-paper
        font-medium font-display tracking-tight shadow-lg shadow-terracotta-500/20
        transition-all hover:bg-terracotta-600 hover:shadow-xl hover:shadow-terracotta-500/30
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-paper

        bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 text-base
        sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 sm:px-7 sm:py-3.5 sm:text-base
      "
      aria-label={CTA_LABEL}
    >
      <span>{CTA_LABEL}</span>
      <svg
        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
