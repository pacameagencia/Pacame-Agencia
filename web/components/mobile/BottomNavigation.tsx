"use client";

/**
 * BottomNavigation — sticky bottom tab bar mobile-only.
 *
 * Solo visible en mobile (< md breakpoint). Da a la web sensación de app
 * nativa. 5 tabs editoriales con iconos cerámicos generados:
 *   Inicio / Servicios / Agentes / Casos / Contacto
 *
 * Highlights:
 *  - safe-area-inset-bottom para iPhone con home indicator
 *  - active state con line indicator en mustard
 *  - touch feedback (active:scale-95 + bg subtle)
 *  - aria-current="page" para a11y
 *  - 56px height (Material Design standard) + safe area
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sparkles,
  Users,
  Trophy,
  MessageSquare,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Home;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/servicios", label: "Servicios", Icon: Sparkles },
  { href: "/agentes", label: "Agentes", Icon: Users },
  { href: "/casos", label: "Casos", Icon: Trophy },
  { href: "/contacto", label: "Contacto", Icon: MessageSquare },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  // Hide on dashboard, portal and admin pages (their own UI takes over)
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/portal") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-xl border-t border-ink/10 md:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Navegación principal móvil"
    >
      <ul className="flex items-stretch justify-around h-14">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname?.startsWith(href);

          return (
            <li key={href} className="flex-1 flex">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center w-full gap-0.5 transition-colors duration-200 active:scale-95 active:bg-ink/5 ${
                  isActive ? "text-terracotta-600" : "text-ink/55"
                }`}
              >
                {/* Top indicator line cuando active */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-terracotta-500 rounded-b-sm"
                    aria-hidden="true"
                  />
                )}
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.6}
                />
                <span
                  className={`text-[10px] font-mono tracking-wider uppercase ${
                    isActive ? "font-medium" : ""
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
