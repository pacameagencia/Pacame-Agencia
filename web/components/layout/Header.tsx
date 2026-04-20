"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/servicios", label: "Servicios" },
  { href: "/auditoria", label: "Auditoría" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/equipo", label: "Equipo" },
  { href: "/blog", label: "Diario" },
  { href: "/contacto", label: "Contacto" },
];

function PacameMark() {
  // Sello circular modernista (8-pointed star) — no más logo SaaS con gradiente
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="17" fill="none" stroke="#1A1813" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="14" fill="none" stroke="#B54E30" strokeWidth="1" />
      {/* 8-pointed star */}
      <path
        d="M18 5 L20 16 L31 18 L20 20 L18 31 L16 20 L5 18 L16 16 Z"
        fill="#B54E30"
      />
      <circle cx="18" cy="18" r="2" fill="#E8B730" />
    </svg>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-editorial",
        scrolled ? "bg-paper/95 backdrop-blur-sm py-3 border-b border-ink/10" : "bg-paper/0 py-5"
      )}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo — sello modernista */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="transition-transform duration-500 ease-editorial group-hover:rotate-12">
              <PacameMark />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-medium text-xl text-ink tracking-tight">
                PACAME
              </span>
              <span className="font-mono text-[9px] text-ink-mute tracking-[0.25em] uppercase mt-0.5">
                Est. 2026 · Madrid
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-7"
            role="navigation"
            aria-label="Navegación principal"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-[14px] font-sans font-medium tracking-tight transition-colors duration-300",
                  pathname === link.href
                    ? "text-terracotta-500"
                    : "text-ink hover:text-terracotta-500"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-terracotta-500"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* CTA — botón estilo sello */}
          <div className="hidden md:flex items-center">
            <Link
              href="/contacto"
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta-500 text-paper font-sans font-medium text-[13px] tracking-wide transition-all duration-300 hover:bg-terracotta-600 rounded-sm"
              style={{ boxShadow: "3px 3px 0 #1A1813" }}
            >
              Hablar con el equipo
              <span className="w-4 h-px bg-paper group-hover:w-6 transition-all duration-300" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 text-ink hover:text-terracotta-500 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden mt-4 pb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.7, 0, 0.3, 1] }}
            >
              <div className="h-px bg-ink/15 mb-4" />
              <nav className="flex flex-col" aria-label="Navegación móvil">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-1 py-4 text-[18px] font-display font-medium block border-b border-ink/10 transition-colors",
                        pathname === link.href
                          ? "text-terracotta-500"
                          : "text-ink hover:text-terracotta-500"
                      )}
                    >
                      <span className="font-mono text-[11px] text-ink-mute mr-3 tracking-widest">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-6">
                  <Link
                    href="/contacto"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-5 py-4 bg-terracotta-500 text-paper font-sans font-medium rounded-sm"
                    style={{ boxShadow: "3px 3px 0 #1A1813" }}
                  >
                    Hablar con el equipo
                  </Link>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
