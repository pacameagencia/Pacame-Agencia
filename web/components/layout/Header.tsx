"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Globe,
  PenTool,
  TrendingUp,
  Instagram,
  Target,
  BarChart3,
  Boxes,
  Download,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Categorias servicios (matchea DB service_categories slugs)
const servicesMenu = [
  { slug: "branding", label: "Branding e Identidad", desc: "Logos, favicons, manual", Icon: Sparkles },
  { slug: "web", label: "Web y Desarrollo", desc: "Landings, webs, tiendas", Icon: Globe },
  { slug: "copy", label: "Copy y Contenido", desc: "Copywriting, blog, scripts", Icon: PenTool },
  { slug: "seo", label: "SEO y Posicionamiento", desc: "Auditorias, link building", Icon: TrendingUp },
  { slug: "social", label: "Redes Sociales", desc: "Posts, reels, estrategia", Icon: Instagram },
  { slug: "ads", label: "Publicidad Digital", desc: "Meta, Google, TikTok Ads", Icon: Target },
  { slug: "analytics", label: "Analytics y Datos", desc: "GA4, dashboards, KPIs", Icon: BarChart3 },
  { slug: "templates", label: "Templates y Recursos", desc: "Plantillas, kits, descargables", Icon: Download },
  { slug: "apps", label: "Apps y Automatizaciones", desc: "Chatbots, n8n, integraciones", Icon: Boxes },
];

// Menu "Apps" — apps productizadas de PACAME
const appsMenu = [
  {
    slug: "contact-forms",
    href: "/apps/contact-forms",
    label: "Contact Forms",
    desc: "Formularios inteligentes con IA, CRM y enrutado automatico",
    Icon: MessageSquare,
  },
  {
    slug: "agenda-pro",
    href: "/apps/agenda",
    label: "Agenda Pro",
    desc: "Bookings, calendario, recordatorios y cobros integrados",
    Icon: Calendar,
  },
  {
    slug: "all-apps",
    href: "/apps",
    label: "Ver todas las apps",
    desc: "Catalogo completo de apps PACAME con demo live",
    Icon: Boxes,
  },
];

const simpleLinks = [
  { href: "/planes", label: "Planes" },
  { href: "/auditoria", label: "Auditoria Gratis" },
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
      <path
        d="M9 21V7H14.5C17 7 19 9 19 11.5C19 14 17 16 14.5 16H12.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="8" r="1" fill="white" opacity="0.6" />
      <circle cx="22" cy="12" r="0.7" fill="white" opacity="0.4" />
      <circle cx="9" cy="22" r="0.7" fill="white" opacity="0.4" />
    </svg>
  );
}

/**
 * Mega menu panel — Stripe/Linear style
 * Animated fade+scale, 3 cols, cerrado al click fuera
 */
function MegaMenu({
  items,
  baseHref,
  onItemClick,
}: {
  items: typeof servicesMenu | typeof appsMenu;
  baseHref: string;
  onItemClick?: () => void;
}) {
  // Tres columnas sobre desktop
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[780px] max-w-[calc(100vw-2rem)] bg-[#0F0F11]/95 backdrop-blur-2xl border border-olympus-gold/15 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 z-50"
      role="menu"
    >
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const href =
            "href" in item ? item.href : `${baseHref}#${item.slug}`;
          return (
            <Link
              key={item.slug}
              href={href}
              onClick={onItemClick}
              className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors duration-300"
              role="menuitem"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-olympus-gold/10 border border-olympus-gold/20 flex items-center justify-center group-hover:bg-olympus-gold/20 transition-colors">
                <item.Icon className="w-4 h-4 text-olympus-gold" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-heading font-semibold text-pacame-white group-hover:text-olympus-gold-light transition-colors truncate">
                  {item.label}
                </div>
                <div className="text-xs text-pacame-white/45 font-body mt-0.5 leading-relaxed">
                  {item.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer row */}
      <div className="mt-5 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs font-body">
        <span className="text-pacame-white/40">
          24 productos · entrega en horas · sin permanencia
        </span>
        <Link
          href={baseHref}
          onClick={onItemClick}
          className="text-olympus-gold hover:text-olympus-gold-light transition-colors inline-flex items-center gap-1"
        >
          Ver todo
          <ChevronDown className="w-3 h-3 -rotate-90" />
        </Link>
      </div>
    </motion.div>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"services" | "apps" | null>(null);
  const [mobileServices, setMobileServices] = useState(false);
  const [mobileApps, setMobileApps] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click fuera cierra el mega menu
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

  // Cerrar en cambio de ruta
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-apple",
        scrolled
          ? "bg-[#0A0A0A]/85 backdrop-blur-xl py-3"
          : "bg-transparent py-5"
      )}
    >
      {scrolled && (
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/20 to-transparent" />
      )}

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="transition-transform duration-300 group-hover:scale-105">
              <PacameLogo />
            </div>
            <span className="font-heading font-bold text-lg text-pacame-white tracking-tight">
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
            {/* Services dropdown */}
            <button
              onClick={() =>
                setOpenMenu(openMenu === "services" ? null : "services")
              }
              onMouseEnter={() => setOpenMenu("services")}
              className={cn(
                "flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-medium font-body transition-all duration-300",
                pathname.startsWith("/servicios")
                  ? "text-pacame-white bg-white/[0.05]"
                  : "text-pacame-white/55 hover:text-pacame-white"
              )}
              aria-haspopup="true"
              aria-expanded={openMenu === "services"}
            >
              Servicios
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-300",
                  openMenu === "services" && "rotate-180"
                )}
              />
            </button>

            {/* Apps dropdown */}
            <button
              onClick={() => setOpenMenu(openMenu === "apps" ? null : "apps")}
              onMouseEnter={() => setOpenMenu("apps")}
              className={cn(
                "flex items-center gap-1 px-3.5 py-2 rounded-full text-[13px] font-medium font-body transition-all duration-300",
                pathname.startsWith("/apps")
                  ? "text-pacame-white bg-white/[0.05]"
                  : "text-pacame-white/55 hover:text-pacame-white"
              )}
              aria-haspopup="true"
              aria-expanded={openMenu === "apps"}
            >
              Apps
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-300",
                  openMenu === "apps" && "rotate-180"
                )}
              />
            </button>

            {/* Simple links */}
            {simpleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setOpenMenu(null)}
                className={cn(
                  "relative px-3.5 py-2 rounded-full text-[13px] font-medium font-body transition-all duration-300",
                  pathname === link.href
                    ? "text-pacame-white"
                    : "text-pacame-white/55 hover:text-pacame-white"
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

            {/* Mega menu panels */}
            <AnimatePresence mode="wait">
              {openMenu === "services" && (
                <MegaMenu
                  key="services"
                  items={servicesMenu}
                  baseHref="/servicios"
                  onItemClick={() => setOpenMenu(null)}
                />
              )}
              {openMenu === "apps" && (
                <MegaMenu
                  key="apps"
                  items={appsMenu}
                  baseHref="/apps"
                  onItemClick={() => setOpenMenu(null)}
                />
              )}
            </AnimatePresence>
          </nav>

          {/* CTA desktop */}
          <div className="hidden lg:flex items-center">
            <Button
              variant="gradient"
              size="default"
              asChild
              className="rounded-full text-[13px] px-5 h-9 hover:shadow-glow-gold/30 transition-shadow duration-500"
            >
              <Link href="/contacto">Hablar con el equipo</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-full text-pacame-white/60 hover:text-pacame-white transition-colors"
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
              <div className="h-px bg-gradient-to-r from-transparent via-olympus-gold/20 to-transparent mb-4" />
              <nav className="flex flex-col gap-0.5" aria-label="Navegacion movil">
                {/* Collapsible Servicios */}
                <button
                  onClick={() => setMobileServices(!mobileServices)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-[15px] font-medium font-body transition-all flex items-center justify-between",
                    pathname.startsWith("/servicios")
                      ? "text-pacame-white bg-white/[0.06] border-l-2 border-olympus-gold/40"
                      : "text-pacame-white/60 hover:text-pacame-white"
                  )}
                  aria-expanded={mobileServices}
                >
                  <span>Servicios</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      mobileServices && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {mobileServices && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden ml-4 pl-3 border-l border-olympus-gold/15"
                    >
                      {servicesMenu.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/servicios#${s.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-body text-pacame-white/60 hover:text-pacame-white transition-colors"
                        >
                          <s.Icon className="w-3.5 h-3.5 text-olympus-gold/70" />
                          {s.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsible Apps */}
                <button
                  onClick={() => setMobileApps(!mobileApps)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-[15px] font-medium font-body transition-all flex items-center justify-between",
                    pathname.startsWith("/apps")
                      ? "text-pacame-white bg-white/[0.06] border-l-2 border-olympus-gold/40"
                      : "text-pacame-white/60 hover:text-pacame-white"
                  )}
                  aria-expanded={mobileApps}
                >
                  <span>Apps</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      mobileApps && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {mobileApps && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden ml-4 pl-3 border-l border-olympus-gold/15"
                    >
                      {appsMenu.map((a) => (
                        <Link
                          key={a.slug}
                          href={a.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-body text-pacame-white/60 hover:text-pacame-white transition-colors"
                        >
                          <a.Icon className="w-3.5 h-3.5 text-olympus-gold/70" />
                          {a.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simple links */}
                {simpleLinks.map((link, i) => (
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
                  <Button
                    variant="gradient"
                    size="default"
                    className="w-full rounded-full"
                    asChild
                  >
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
