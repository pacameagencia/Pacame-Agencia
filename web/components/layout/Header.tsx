"use client";

/**
 * PACAME Header tier-1 (Adobe/Apple/Hostinger class)
 * - Mega menus storytelling con descripciones reales, no labels frios
 * - "Soluciones" (8 verticales PACAME sub-brands)
 * - "Productos" (por objetivo: Atraer / Cerrar / Operar)
 * - "Apps" (productizadas)
 * - "Recursos" (Blog, Casos, Auditoria gratis, ROI, Refiere)
 * - "Empresa" (Sobre, Agentes, Contacto, Colabora)
 * - Mobile: accordions + slide-in
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GlobalSearch from "@/components/search/GlobalSearch";
import {
  verticalMenu,
  personasMenu,
  productsByGoalMenu,
  appsMenu,
  resourcesMenu,
  companyMenu,
  primaryLinks,
  type MenuItem,
  type MenuGroup,
} from "@/lib/data/nav-menu";

type OpenMenu =
  | "soluciones"
  | "productos"
  | "apps"
  | "recursos"
  | "empresa"
  | null;

// ─── Logo SVG ───────────────────────────────────────────────────
function PacameLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-label="PACAME">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2872A1" />
          <stop offset="50%" stopColor="#F1E194" />
          <stop offset="100%" stopColor="#5B0E14" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
      <path
        d="M10 24V8H17C19.76 8 22 10.24 22 13C22 15.76 19.76 18 17 18H14.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="23" cy="9" r="1.2" fill="white" opacity="0.7" />
      <circle cx="25" cy="13" r="0.8" fill="white" opacity="0.5" />
    </svg>
  );
}

// ─── Mega menu item (card con kicker + icon + desc + badge) ─────
function MegaItem({ item, onClick }: { item: MenuItem; onClick?: () => void }) {
  const Icon = item.Icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors duration-300"
      role="menuitem"
    >
      {Icon && (
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center group-hover:bg-accent-gold/20 group-hover:border-accent-gold/40 transition-colors">
          <Icon className="w-4.5 h-4.5 text-accent-gold" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-heading font-semibold text-ink group-hover:text-accent-gold-soft transition-colors truncate">
            {item.label}
          </span>
          {item.badge && (
            <span className="flex-shrink-0 text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded bg-mint/15 text-mint border border-mint/30">
              {item.badge}
            </span>
          )}
        </div>
        {item.desc && (
          <div className="text-xs text-ink/50 font-body leading-snug mb-1">{item.desc}</div>
        )}
        {item.kicker && (
          <div className="text-[10px] font-mono tracking-wider text-accent-gold/70 uppercase">
            {item.kicker}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Layouts de mega menu ───────────────────────────────────────

function MegaSoluciones({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="w-[1100px] max-w-[calc(100vw-2rem)] bg-paper/95 backdrop-blur-2xl border border-accent-gold/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-ink/[0.06]">
        <div>
          <div className="text-[10px] font-mono tracking-[0.22em] text-accent-gold uppercase">
            Soluciones · 8 sectores × 3 personas
          </div>
          <div className="text-sm text-ink/60 font-body mt-0.5">
            24 webs tier-1 listas para TU sub-audiencia exacta.{" "}
            <span className="text-ink/80 font-medium">Gimnasio ≠ entrenador personal.</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/encuentra-tu-solucion"
            onClick={onItemClick}
            className="text-xs text-ink/60 hover:text-accent-gold transition inline-flex items-center gap-1 border border-ink/10 hover:border-accent-gold/40 px-3 py-1.5 rounded-full font-mono uppercase tracking-wider"
          >
            Quiz 2 min
          </Link>
          <Link
            href="/portafolio"
            onClick={onItemClick}
            className="text-xs text-accent-gold hover:text-accent-gold-soft transition inline-flex items-center gap-1"
          >
            Ver indice <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-x-5 gap-y-6">
        {personasMenu.map((entry) => {
          const VIcon = entry.vertical_icon;
          return (
            <div key={entry.vertical_slug}>
              <Link
                href={`/portafolio/${entry.vertical_slug}`}
                onClick={onItemClick}
                className="group flex items-center gap-2 mb-2 pb-2 border-b border-ink/10 hover:border-accent-gold/40 transition-colors"
              >
                {VIcon && (
                  <VIcon className="w-3.5 h-3.5 text-accent-gold flex-shrink-0" />
                )}
                <span className="font-heading font-semibold text-[13px] text-ink group-hover:text-accent-gold transition-colors truncate">
                  PACAME {entry.vertical_label}
                </span>
              </Link>
              <ul className="space-y-1">
                {entry.personas.map((persona) => (
                  <li key={persona.persona_slug}>
                    <Link
                      href={`/portafolio/${entry.vertical_slug}/${persona.persona_slug}`}
                      onClick={onItemClick}
                      className="group flex items-start gap-1.5 py-1 px-1.5 -mx-1.5 rounded hover:bg-accent-gold/[0.06] transition-colors"
                    >
                      <span className="text-[14px] leading-none mt-0.5 flex-shrink-0">
                        {persona.emoji}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[12.5px] text-ink/80 group-hover:text-ink font-body font-medium leading-tight truncate">
                          {persona.name}
                        </div>
                        {persona.kicker && (
                          <div className="text-[10px] font-mono text-ink/35 tracking-wider mt-0.5 truncate">
                            {persona.kicker}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="mt-5 pt-4 border-t border-ink/[0.06] flex items-center justify-between text-xs font-body">
        <span className="text-ink/40">
          ¿Tu sector no esta? Te hacemos la web a medida en 14 dias.
        </span>
        <Link
          href="/contacto"
          onClick={onItemClick}
          className="text-accent-gold hover:text-accent-gold-soft inline-flex items-center gap-1 font-medium"
        >
          Hablar con Pablo <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function MegaProductos({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="w-[980px] max-w-[calc(100vw-2rem)] bg-paper/95 backdrop-blur-2xl border border-accent-gold/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-accent-gold uppercase">
            Servicios por objetivo
          </div>
          <div className="text-sm text-ink/60 font-body mt-0.5">
            24 productos express · Desde 39€ · Entrega en horas
          </div>
        </div>
        <Link
          href="/servicios"
          onClick={onItemClick}
          className="text-xs text-accent-gold hover:text-accent-gold-soft transition inline-flex items-center gap-1"
        >
          Ver marketplace <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {productsByGoalMenu.map((group: MenuGroup) => (
          <div key={group.title}>
            <div className="text-[11px] font-mono uppercase tracking-wider text-ink/40 mb-2 px-3">
              {group.title}
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <MegaItem key={item.href} item={item} onClick={onItemClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MegaApps({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="w-[560px] max-w-[calc(100vw-2rem)] bg-paper/95 backdrop-blur-2xl border border-accent-gold/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-accent-gold uppercase">
            Apps productizadas
          </div>
          <div className="text-sm text-ink/60 font-body mt-0.5">
            SaaS listos para instalar · Sin contratar dev
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {appsMenu.map((item) => (
          <MegaItem key={item.href} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}

function MegaRecursos({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="w-[760px] max-w-[calc(100vw-2rem)] bg-paper/95 backdrop-blur-2xl border border-accent-gold/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-accent-gold uppercase">
            Aprende + herramientas gratis
          </div>
          <div className="text-sm text-ink/60 font-body mt-0.5">
            Todo lo que necesitas para decidir informado
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {resourcesMenu.map((item) => (
          <MegaItem key={item.href} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}

function MegaEmpresa({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="w-[560px] max-w-[calc(100vw-2rem)] bg-paper/95 backdrop-blur-2xl border border-accent-gold/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono tracking-wider text-accent-gold uppercase">
            Quienes somos
          </div>
          <div className="text-sm text-ink/60 font-body mt-0.5">
            10 agentes IA + 120 sub-especialistas supervisados por Pablo
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {companyMenu.map((item) => (
          <MegaItem key={item.href} item={item} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}

// ─── Header principal ───────────────────────────────────────────
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [openMenu]);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  const closeMenu = () => setOpenMenu(null);

  // Trigger button consistente
  const trigger = (key: Exclude<OpenMenu, null>, label: string) => (
    <button
      onClick={() => setOpenMenu(openMenu === key ? null : key)}
      onMouseEnter={() => setOpenMenu(key)}
      className={cn(
        "flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-medium font-body transition-all duration-300",
        openMenu === key ? "text-ink bg-white/[0.06]" : "text-ink/60 hover:text-ink"
      )}
      aria-haspopup="true"
      aria-expanded={openMenu === key}
    >
      {label}
      <ChevronDown
        className={cn(
          "w-3 h-3 transition-transform duration-300",
          openMenu === key && "rotate-180"
        )}
      />
    </button>
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-apple",
        scrolled ? "bg-paper/85 backdrop-blur-xl py-3" : "bg-transparent py-5"
      )}
    >
      {scrolled && (
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />
      )}

      <div className="max-w-7xl mx-auto px-5 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <PacameLogo />
            </div>
            <span className="font-heading font-bold text-lg text-ink tracking-tight">
              PACAME
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            ref={navRef}
            className="hidden lg:flex items-center gap-0.5 relative"
            role="navigation"
            aria-label="Navegacion principal"
          >
            {trigger("soluciones", "Soluciones")}
            {trigger("productos", "Productos")}
            {trigger("apps", "Apps")}
            {trigger("recursos", "Recursos")}
            {trigger("empresa", "Empresa")}

            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setOpenMenu(null)}
                className={cn(
                  "relative px-3.5 py-2 rounded-full text-[13px] font-medium font-body transition-all duration-300",
                  pathname === link.href
                    ? "text-ink"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                {pathname === link.href && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-white/[0.08] border border-accent-gold/15"
                    layoutId="activeNav"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}

            {/* Mega menu panel */}
            <AnimatePresence mode="wait">
              {openMenu && (
                <motion.div
                  key={openMenu}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50"
                  role="menu"
                >
                  {openMenu === "soluciones" && <MegaSoluciones onItemClick={closeMenu} />}
                  {openMenu === "productos" && <MegaProductos onItemClick={closeMenu} />}
                  {openMenu === "apps" && <MegaApps onItemClick={closeMenu} />}
                  {openMenu === "recursos" && <MegaRecursos onItemClick={closeMenu} />}
                  {openMenu === "empresa" && <MegaEmpresa onItemClick={closeMenu} />}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* Search + CTA desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <GlobalSearch />
            <Button
              variant="gradient"
              size="default"
              asChild
              className="rounded-full text-[13px] px-5 h-9 hover:shadow-glow-gold transition-shadow duration-500"
            >
              <Link href="/auditoria">Auditoria gratis</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-full text-ink/70 hover:text-ink transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="lg:hidden mt-4 pb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="h-px bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent mb-4" />

              {/* Search mobile */}
              <div className="mb-4">
                <GlobalSearch />
              </div>

              <nav className="flex flex-col gap-1" aria-label="Navegacion movil">
                {[
                  { key: "m-soluciones", label: "Soluciones", items: verticalMenu },
                  {
                    key: "m-productos",
                    label: "Productos",
                    items: productsByGoalMenu.flatMap((g) => g.items),
                  },
                  { key: "m-apps", label: "Apps", items: appsMenu },
                  { key: "m-recursos", label: "Recursos", items: resourcesMenu },
                  { key: "m-empresa", label: "Empresa", items: companyMenu },
                ].map((section) => (
                  <div key={section.key}>
                    <button
                      onClick={() =>
                        setMobileExpanded(
                          mobileExpanded === section.key ? null : section.key
                        )
                      }
                      className="w-full px-4 py-3 rounded-xl text-[15px] font-medium font-body text-ink/80 hover:text-ink flex items-center justify-between"
                      aria-expanded={mobileExpanded === section.key}
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          mobileExpanded === section.key && "rotate-180"
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileExpanded === section.key && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden ml-3 pl-3 border-l border-accent-gold/20"
                        >
                          {section.items.map((item) => {
                            const Icon = item.Icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-body text-ink/60 hover:text-ink transition-colors"
                              >
                                {Icon && <Icon className="w-3.5 h-3.5 text-accent-gold/70" />}
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[15px] font-medium font-body transition-all",
                      pathname === link.href
                        ? "text-ink bg-white/[0.06] border-l-2 border-accent-gold/40"
                        : "text-ink/60 hover:text-ink"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="mt-4 px-4">
                  <Button
                    variant="gradient"
                    size="default"
                    className="w-full rounded-full"
                    asChild
                  >
                    <Link href="/auditoria" onClick={() => setMobileOpen(false)}>
                      Auditoria gratis
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
