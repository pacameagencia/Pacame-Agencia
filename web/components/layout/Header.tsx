"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-pacame-black/80 backdrop-blur-2xl border-b border-white/[0.08] py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-violet/50">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
            </motion.div>
            <span className="font-heading font-bold text-xl text-pacame-white tracking-tight">
              PACAME
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 rounded-lg text-sm font-medium font-body transition-all duration-300",
                  pathname === link.href
                    ? "text-pacame-white"
                    : "text-pacame-white/60 hover:text-pacame-white"
                )}
              >
                {pathname === link.href && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-white/10"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="gradient" size="default" asChild className="shadow-glow-violet/30">
              <Link href="/contacto">
                Hablar con el equipo
              </Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-pacame-white/70 hover:text-pacame-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden mt-3 pb-4 border-t border-white/[0.08]"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <nav className="flex flex-col gap-1 mt-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-medium font-body transition-all block",
                        pathname === link.href
                          ? "text-pacame-white bg-white/10"
                          : "text-pacame-white/60 hover:text-pacame-white hover:bg-white/5"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-3 px-4">
                  <Button variant="gradient" size="default" className="w-full shadow-glow-violet/30" asChild>
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
