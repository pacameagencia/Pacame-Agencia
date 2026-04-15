"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/servicios", label: "Servicios" },
  { href: "/auditoria", label: "Auditoria Gratis" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/equipo", label: "Equipo" },
  { href: "/blog", label: "Blog" },
  { href: "/contacto", label: "Contacto" },
];

function PacameLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#D4A853" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#logo-grad)" />
      {/* Stylized P with constellation dots */}
      <path d="M9 21V7H14.5C17 7 19 9 19 11.5C19 14 17 16 14.5 16H12.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Constellation dots */}
      <circle cx="20" cy="8" r="1" fill="white" opacity="0.6" />
      <circle cx="22" cy="12" r="0.7" fill="white" opacity="0.4" />
      <circle cx="9" cy="22" r="0.7" fill="white" opacity="0.4" />
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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-apple",
        scrolled
          ? "bg-[#0A0A0A]/80 backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      )}
    >
      {/* Golden border on scroll */}
      {scrolled && (
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/20 to-transparent" />
      )}

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <PacameLogo />
            </div>
            <span className="font-heading font-bold text-lg text-pacame-white tracking-tight">
              PACAME
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Navegacion principal">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3.5 py-2 rounded-full text-[13px] font-medium font-body transition-all duration-300",
                  pathname === link.href
                    ? "text-pacame-white"
                    : "text-pacame-white/50 hover:text-pacame-white/80"
                )}
              >
                {pathname === link.href && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/[0.07] border border-olympus-gold/10"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center">
            <Button
              variant="gradient"
              size="default"
              asChild
              className="rounded-full text-[13px] px-5 h-9 hover:shadow-glow-gold/30 transition-shadow duration-500"
            >
              <Link href="/contacto">
                Hablar con el equipo
              </Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-full text-pacame-white/60 hover:text-pacame-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menu de navegacion" : "Abrir menu de navegacion"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="h-px bg-gradient-to-r from-transparent via-olympus-gold/20 to-transparent mb-4" />
              <nav className="flex flex-col gap-0.5" aria-label="Navegacion movil">
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
                        "px-4 py-3 rounded-xl text-[15px] font-medium font-body transition-all block",
                        pathname === link.href
                          ? "text-pacame-white bg-white/[0.06] border-l-2 border-olympus-gold/40"
                          : "text-pacame-white/50 hover:text-pacame-white"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-4 px-4">
                  <Button variant="gradient" size="default" className="w-full rounded-full" asChild>
                    <Link href="/contacto" onClick={() => setMobileOpen(false)}>
                      Hablar con el equipo
                    </Link>
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
