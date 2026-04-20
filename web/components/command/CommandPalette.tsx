"use client";

/**
 * Command Palette global — Cmd/Ctrl+K.
 * Construido con cmdk (mismo pattern que Linear / Vercel / Raycast).
 *
 * Accede desde cualquier pagina con Cmd+K → navegar dashboard, crear propuesta,
 * buscar cliente, ir a games, etc. Keyboard-first, fuzzy search built-in.
 */

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  LayoutDashboard,
  Users,
  Package,
  Award,
  Heart,
  Banknote,
  Shield,
  TrendingUp,
  ShoppingBag,
  FileText,
  Megaphone,
  BookOpen,
  Sparkles,
  Gamepad2,
  Lightbulb,
  MessageCircle,
  Mail,
  Target,
  Brain,
  Rocket,
  Settings,
  HomeIcon,
  ExternalLink,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  external?: boolean;
  icon: React.ElementType;
  section: string;
  keywords?: string[];
  action?: () => void;
}

const ITEMS: CommandItem[] = [
  // Navigation — Dashboard
  { id: "nav:dashboard", label: "Overview", hint: "Metricas generales", href: "/dashboard", icon: LayoutDashboard, section: "Dashboard" },
  { id: "nav:clients", label: "Clientes", hint: "Gestion de clientes activos", href: "/dashboard/clients", icon: Users, section: "Dashboard" },
  { id: "nav:leads", label: "Leads", hint: "Pipeline con scoring", href: "/dashboard/leads", icon: Target, section: "Dashboard" },
  { id: "nav:leadgen", label: "Lead Gen", hint: "Scraping Google Maps + outreach", href: "/dashboard/leadgen", icon: Rocket, section: "Dashboard" },
  { id: "nav:orders", label: "Pedidos", hint: "Orders marketplace + estado", href: "/dashboard/orders", icon: ShoppingBag, section: "Dashboard" },
  { id: "nav:growth", label: "Growth Loop", hint: "NPS + lifecycle + referrals", href: "/dashboard/growth", icon: Heart, section: "Dashboard" },
  { id: "nav:llm-costs", label: "LLM Costs", hint: "Spend por tier + caps", href: "/dashboard/llm-costs", icon: Banknote, section: "Dashboard" },
  { id: "nav:env", label: "Env Registry", hint: "Todas las env vars + status", href: "/dashboard/env", icon: Shield, section: "Dashboard" },
  { id: "nav:catalog", label: "Marketplace catalog", hint: "Productos + servicios", href: "/dashboard/catalog", icon: Package, section: "Dashboard" },
  { id: "nav:content", label: "Contenido", hint: "Calendario editorial", href: "/dashboard/content", icon: FileText, section: "Dashboard" },
  { id: "nav:campaigns", label: "Campanas", hint: "Marketing campaigns", href: "/dashboard/campaigns", icon: Megaphone, section: "Dashboard" },
  { id: "nav:brain", label: "Cerebro DIOS", hint: "Motor estrategico diario", href: "/dashboard/brain", icon: Brain, section: "Dashboard" },
  { id: "nav:referrals", label: "Referidos", hint: "Partners + codigos", href: "/dashboard/referrals", icon: Award, section: "Dashboard" },

  // Public pages
  { id: "pub:home", label: "Home", hint: "pacameagencia.com", href: "/", icon: HomeIcon, section: "Sitio publico" },
  { id: "pub:servicios", label: "Servicios", hint: "Marketplace publico", href: "/servicios", icon: Package, section: "Sitio publico" },
  { id: "pub:planes", label: "Planes", hint: "Suscripciones mensuales", href: "/planes", icon: Sparkles, section: "Sitio publico" },
  { id: "pub:games", label: "Games", hint: "Experiencias jugables", href: "/games", icon: Gamepad2, section: "Sitio publico" },
  { id: "pub:casos", label: "Casos de exito", href: "/casos", icon: TrendingUp, section: "Sitio publico" },
  { id: "pub:blog", label: "Blog", href: "/blog", icon: FileText, section: "Sitio publico" },
  { id: "pub:refiere", label: "Refiere (programa)", hint: "Codigo referral + compartir", href: "/refiere", icon: Award, section: "Sitio publico" },
  { id: "pub:contacto", label: "Contacto", href: "/contacto", icon: Mail, section: "Sitio publico" },

  // Docs + config
  { id: "docs:api", label: "API Docs", hint: "OpenAPI spec Swagger UI", href: "/docs/api", icon: BookOpen, section: "Docs" },
  { id: "cfg:settings", label: "Config", hint: "Ajustes cuenta + sistema", href: "/dashboard/settings", icon: Settings, section: "Docs" },

  // External
  {
    id: "ext:vercel",
    label: "Vercel dashboard",
    hint: "Deployments + env vars",
    href: "https://vercel.com/pacames-projects/web",
    external: true,
    icon: ExternalLink,
    section: "Externo",
    keywords: ["deploy", "vercel", "hosting"],
  },
  {
    id: "ext:supabase",
    label: "Supabase dashboard",
    hint: "DB + storage + auth",
    href: "https://supabase.com/dashboard/project/kfmnllpscheodgxnutkw",
    external: true,
    icon: ExternalLink,
    section: "Externo",
    keywords: ["database", "db", "supabase"],
  },
  {
    id: "ext:stripe",
    label: "Stripe dashboard",
    hint: "Payments + customers",
    href: "https://dashboard.stripe.com",
    external: true,
    icon: ExternalLink,
    section: "Externo",
    keywords: ["payments", "stripe", "charges"],
  },
  {
    id: "tip:discovery",
    label: "Tip del dia",
    hint: "Ideas de mejora PACAME",
    href: "/dashboard/discoveries",
    icon: Lightbulb,
    section: "Docs",
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(item: CommandItem) {
    setOpen(false);
    if (item.action) {
      item.action();
      return;
    }
    if (item.external && item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else if (item.href) {
      router.push(item.href);
    }
  }

  // Group by section
  const bySection = ITEMS.reduce((acc, it) => {
    (acc[it.section] = acc[it.section] || []).push(it);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <>
      {/* Trigger header/footer mobile con click expose */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <Command
            label="Command Menu"
            className="w-full max-w-2xl bg-paper-deep border border-ink/10 rounded-2xl shadow-2xl overflow-hidden"
            filter={(value, search, keywords) => {
              const target = (value + " " + (keywords?.join(" ") || "")).toLowerCase();
              if (target.includes(search.toLowerCase())) return 1;
              return 0;
            }}
          >
            <div className="flex items-center gap-3 p-4 border-b border-ink/5">
              <Search className="w-5 h-5 text-brand-primary flex-shrink-0" />
              <Command.Input
                placeholder="Que quieres hacer? (nav, crear, buscar...)"
                className="flex-1 bg-transparent border-0 outline-none text-ink placeholder:text-ink/30 text-base"
                autoFocus
              />
              <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md border border-ink/10 font-mono text-[10px] text-ink/40">
                esc
              </kbd>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="p-6 text-center text-ink/50 text-sm">
                Sin resultados.
              </Command.Empty>

              {Object.entries(bySection).map(([section, items]) => (
                <Command.Group
                  key={section}
                  heading={section}
                  className="mb-2 px-2 py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-ink/40 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:px-2"
                >
                  {items.map((it) => {
                    const Icon = it.icon;
                    return (
                      <Command.Item
                        key={it.id}
                        value={it.label + " " + (it.hint || "")}
                        keywords={it.keywords}
                        onSelect={() => go(it)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition data-[selected=true]:bg-brand-primary/10 data-[selected=true]:text-brand-primary hover:bg-white/[0.04]"
                      >
                        <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-ink truncate">
                            {it.label}
                          </div>
                          {it.hint && (
                            <div className="text-[11px] text-ink/50 truncate">
                              {it.hint}
                            </div>
                          )}
                        </div>
                        {it.external && (
                          <ExternalLink className="w-3 h-3 text-ink/30 flex-shrink-0" />
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
            </Command.List>

            <div className="flex items-center justify-between px-4 py-2 border-t border-ink/5 text-[11px] text-ink/40 font-body">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded border border-ink/10 font-mono">↑↓</kbd>{" "}
                  navegar
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded border border-ink/10 font-mono">↵</kbd>{" "}
                  ir
                </span>
              </div>
              <span className="text-brand-primary/60">PACAME ⌘K</span>
            </div>
          </Command>
        </div>
      )}
    </>
  );
}
