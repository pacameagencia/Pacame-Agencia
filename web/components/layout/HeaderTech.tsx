"use client";

/**
 * PACAME — HeaderTech (Sprint 25)
 *
 * Header minimalista estilo Linear/Anthropic.
 * Logo + 5 nav items + ThemeSwitcher + CTA magnetic "Hablar con el equipo".
 * Sticky con backdrop-blur que aparece al scroll.
 * Mobile: hamburger + slide-over Radix Dialog.
 *
 * Reemplaza el Header.tsx legacy (mega menu Adobe-class) para todas las
 * páginas. Las páginas legacy (portal, dashboard) tienen sus propios layouts.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import MagneticBox from "@/components/effects/MagneticBox";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import { EASE_APPLE } from "@/lib/animations/easings";

const NAV = [
  { label: "Servicios", href: "/servicios" },
  { label: "Agentes", href: "/agentes" },
  { label: "Casos", href: "/casos" },
  { label: "Sectores", href: "/para" },
  { label: "Blog", href: "/blog" },
];

function PacameWordmark() {
  return (
    <svg
      width="120"
      height="20"
      viewBox="0 0 120 20"
      fill="none"
      aria-label="PACAME"
      className="text-tech-text"
    >
      <text
        x="0"
        y="15"
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontWeight="700"
        fontSize="16"
        letterSpacing="0.04em"
        fill="currentColor"
      >
        PACAME
      </text>
      <circle cx="92" cy="10" r="2" fill="var(--tech-accent)" />
    </svg>
  );
}

export default function HeaderTech() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide on portal/dashboard/admin (sus layouts propios)
  if (
    pathname?.startsWith("/portal") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-tech-border bg-tech-bg/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          aria-label="PACAME inicio"
          data-cursor="hover"
          className="inline-flex items-center gap-2 text-tech-text transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40 rounded"
        >
          <PacameWordmark />
        </Link>

        {/* Nav desktop */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-cursor="hover"
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "text-tech-text"
                    : "text-tech-text-soft hover:text-tech-text"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    transition={{ duration: 0.4, ease: EASE_APPLE }}
                    className="absolute inset-0 -z-10 rounded-full bg-tech-surface"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 md:gap-3">
          <ThemeSwitcher />

          <MagneticBox strength={0.15}>
            <Link
              href="/contacto"
              data-cursor="hover"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-tech-accent px-4 py-2 text-[13px] font-semibold text-tech-bg transition-all duration-300 hover:bg-tech-accent-soft hover:shadow-tech-glow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-tech-accent-glow active:scale-[0.98]"
            >
              Hablar con el equipo
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </Link>
          </MagneticBox>

          {/* Mobile menu trigger */}
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                aria-label="Abrir menú"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-tech-border bg-tech-surface text-tech-text-soft transition-colors hover:border-tech-text-faint hover:text-tech-text focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40 md:hidden"
              >
                <Menu className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <AnimatePresence>
                {open && (
                  <>
                    <Dialog.Overlay asChild forceMount>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-tech-bg/80 backdrop-blur-md"
                      />
                    </Dialog.Overlay>
                    <Dialog.Content asChild forceMount>
                      <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.4, ease: EASE_APPLE }}
                        className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col bg-tech-surface text-tech-text shadow-tech-xl"
                      >
                        <Dialog.Title className="sr-only">Menú</Dialog.Title>
                        <div className="flex items-center justify-between border-b border-tech-border px-6 py-4">
                          <PacameWordmark />
                          <Dialog.Close asChild>
                            <button
                              aria-label="Cerrar menú"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-tech-border text-tech-text-soft hover:border-tech-accent hover:text-tech-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
                            >
                              <X className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </Dialog.Close>
                        </div>

                        <nav className="flex-1 px-6 py-8" aria-label="Navegación móvil">
                          <ul className="space-y-1">
                            {NAV.map((item, i) => {
                              const active = pathname?.startsWith(item.href);
                              return (
                                <motion.li
                                  key={item.href}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{
                                    duration: 0.4,
                                    delay: 0.1 + i * 0.05,
                                    ease: EASE_APPLE,
                                  }}
                                >
                                  <Link
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    aria-current={active ? "page" : undefined}
                                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-4 text-[20px] font-medium transition-colors ${
                                      active
                                        ? "bg-tech-elevated text-tech-text"
                                        : "text-tech-text-soft hover:bg-tech-elevated hover:text-tech-text"
                                    }`}
                                  >
                                    {item.label}
                                    <ArrowUpRight
                                      className="h-4 w-4 text-tech-text-mute"
                                      strokeWidth={1.8}
                                    />
                                  </Link>
                                </motion.li>
                              );
                            })}
                          </ul>
                        </nav>

                        <div className="border-t border-tech-border px-6 py-6">
                          <Link
                            href="/contacto"
                            onClick={() => setOpen(false)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tech-accent px-6 py-3.5 text-[14px] font-semibold text-tech-bg transition-all hover:bg-tech-accent-soft active:scale-[0.98]"
                          >
                            Hablar con el equipo
                            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                          </Link>
                          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
                            Madrid · Lun–Vie · 9–19h
                          </p>
                        </div>
                      </motion.div>
                    </Dialog.Content>
                  </>
                )}
              </AnimatePresence>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
