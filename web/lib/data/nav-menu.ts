/**
 * PACAME Navigation — single source of truth.
 * Estructura tier Adobe/Apple/Hostinger: cada item tiene storytelling real,
 * no labels frios. Usado por Header (desktop mega-menu + mobile) y Footer.
 */

import type { ComponentType } from "react";
import {
  Utensils,
  Bed,
  Stethoscope,
  Dumbbell,
  Home as HomeIcon,
  ShoppingBag,
  GraduationCap,
  Zap,
  Briefcase,
  Users,
  Rocket,
  Sparkles,
  PenTool,
  TrendingUp,
  Globe,
  Instagram,
  Target,
  BarChart3,
  Box,
  Calendar,
  MessageSquare,
  Gamepad2,
  Lightbulb,
  BookOpen,
  FileText,
  Building2,
  Award,
  type LucideIcon,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  desc?: string;          // storytelling 1 linea
  Icon?: LucideIcon | ComponentType<{ className?: string }>;
  badge?: string;         // "Nuevo", "Top", "10x"
  kicker?: string;        // microlabel editorial ("DESDE 99€", "EN 7 DIAS")
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
  /** Opcional: CTA destacado a pie del grupo */
  featured?: {
    title: string;
    desc: string;
    href: string;
    kicker?: string;
  };
}

// ─── Soluciones por vertical (PACAME sub-brands) ─────────────────
export const verticalMenu: MenuItem[] = [
  {
    label: "PACAME Restaurante",
    href: "/portafolio/restaurante",
    desc: "Reservas online + menu digital + bot WhatsApp 24h",
    Icon: Utensils,
    kicker: "EN 7 DIAS · DESDE 799€",
  },
  {
    label: "PACAME Hotel",
    href: "/portafolio/hotel",
    desc: "Reservas directas + tours 360 + channel manager",
    Icon: Bed,
    kicker: "EN 10 DIAS · AHORRO 18%",
  },
  {
    label: "PACAME Clinica",
    href: "/portafolio/clinica",
    desc: "Cita online + portal paciente + LOPDGDD",
    Icon: Stethoscope,
    kicker: "EN 10 DIAS · GDPR",
  },
  {
    label: "PACAME Gym",
    href: "/portafolio/gym",
    desc: "Clases + membresias Stripe + app cliente",
    Icon: Dumbbell,
    kicker: "EN 7 DIAS",
  },
  {
    label: "PACAME Inmo",
    href: "/portafolio/inmobiliaria",
    desc: "Portal + tours 360 + sync Idealista/Fotocasa",
    Icon: HomeIcon,
    kicker: "EN 14 DIAS",
  },
  {
    label: "PACAME Shop",
    href: "/portafolio/ecommerce",
    desc: "Tienda premium + checkout optimizado + feed Google",
    Icon: ShoppingBag,
    kicker: "EN 10 DIAS",
  },
  {
    label: "PACAME Academy",
    href: "/portafolio/formacion",
    desc: "Cursos propios sin comisiones + comunidad",
    Icon: GraduationCap,
    kicker: "EN 14 DIAS · 0% COMISION",
    badge: "Top",
  },
  {
    label: "PACAME Core (SaaS)",
    href: "/portafolio/saas",
    desc: "De idea a SaaS facturando en 21 dias",
    Icon: Zap,
    kicker: "EN 21 DIAS",
    badge: "Nuevo",
  },
];

// ─── Productos marketplace (servicios por objetivo) ───────────────
export const productsByGoalMenu: MenuGroup[] = [
  {
    title: "Atraer clientes",
    items: [
      { label: "Landing 1 pagina", href: "/servicios/landing-1page", desc: "Convierte visitas en leads en 48h", Icon: Globe, kicker: "DESDE 99€" },
      { label: "SEO express", href: "/servicios/seo-audit-pdf", desc: "Auditoria + plan de accion en PDF", Icon: TrendingUp, kicker: "GRATIS" },
      { label: "Meta Ads setup", href: "/servicios/meta-ads-setup", desc: "Pixel + campana + creativos", Icon: Target, kicker: "DESDE 149€" },
      { label: "4 posts Instagram", href: "/servicios/post-instagram", desc: "Contenido premium listo para publicar", Icon: Instagram, kicker: "39€" },
    ],
  },
  {
    title: "Cerrar ventas",
    items: [
      { label: "Propuesta comercial IA", href: "/servicios/propuesta-express", desc: "Genera propuesta tailor-made en 1h", Icon: FileText, kicker: "DESDE 79€" },
      { label: "Funnel completo", href: "/servicios/funnel-pro", desc: "Landing + email nurture + Meta Ads", Icon: Rocket, kicker: "DESDE 1.499€" },
      { label: "Chatbot WhatsApp IA", href: "/apps/contact-forms", desc: "Responde + califica + agenda 24/7", Icon: MessageSquare, kicker: "DESDE 29€/mes" },
      { label: "Email sequence 5", href: "/servicios/email-sequence-5", desc: "Nurture que convierte lookers en buyers", Icon: Sparkles, kicker: "99€" },
    ],
  },
  {
    title: "Operar mejor",
    items: [
      { label: "PACAME Agenda", href: "/apps/agenda", desc: "Bookings + recordatorios + pagos integrados", Icon: Calendar, kicker: "DESDE 39€/mes" },
      { label: "Analytics dashboard", href: "/servicios/analytics-dashboard", desc: "KPIs unificados GA4+Stripe+CRM", Icon: BarChart3, kicker: "DESDE 199€" },
      { label: "Automatiza con n8n", href: "/servicios/automatizaciones-n8n", desc: "Conecta 400+ apps sin codigo", Icon: Box, kicker: "DESDE 149€" },
      { label: "Copy + branding", href: "/servicios/brand-guidelines-mini", desc: "Identidad solida que transmite confianza", Icon: PenTool, kicker: "DESDE 79€" },
    ],
  },
];

// ─── Apps productizadas ───────────────────────────────────────────
export const appsMenu: MenuItem[] = [
  {
    label: "Contact Forms IA",
    href: "/apps/contact-forms",
    desc: "Formularios inteligentes con CRM + enrutado automatico",
    Icon: MessageSquare,
    kicker: "DESDE 29€/mes",
  },
  {
    label: "PACAME Agenda",
    href: "/apps/agenda",
    desc: "Bookings, calendario, recordatorios y cobros integrados",
    Icon: Calendar,
    kicker: "DESDE 39€/mes",
  },
  {
    label: "Games & experiencias",
    href: "/games",
    desc: "Unity WebGL + Three.js demos que venden",
    Icon: Gamepad2,
    kicker: "NUEVO",
    badge: "Beta",
  },
  {
    label: "Ver todas las apps",
    href: "/apps",
    desc: "Catalogo completo con demo live",
    Icon: Box,
  },
];

// ─── Recursos ─────────────────────────────────────────────────────
export const resourcesMenu: MenuItem[] = [
  { label: "Blog", href: "/blog", desc: "Guias practicas de SEO, Ads, Web y IA", Icon: BookOpen },
  { label: "Casos de exito", href: "/casos", desc: "Historias reales con numeros", Icon: Award },
  { label: "Auditoria gratis", href: "/auditoria", desc: "Te decimos en 10 min donde pierdes trafico", Icon: Lightbulb, kicker: "GRATIS" },
  { label: "Calculadora ROI", href: "/calculadora-roi", desc: "Simula tu retorno antes de contratar", Icon: BarChart3 },
  { label: "7 errores comunes", href: "/7-errores", desc: "Los fallos digitales mas caros para PYMEs", Icon: FileText },
  { label: "Refiere y gana", href: "/refiere", desc: "15% de comision recurrente por cliente", Icon: Users, kicker: "15% COMISION" },
];

// ─── Empresa ──────────────────────────────────────────────────────
export const companyMenu: MenuItem[] = [
  { label: "Sobre PACAME", href: "/equipo", desc: "El equipo que hay detras", Icon: Building2 },
  { label: "Agentes IA", href: "/agentes", desc: "Los 10 agentes + 120 sub-especialistas", Icon: Sparkles },
  { label: "Contacto", href: "/contacto", desc: "Habla con Pablo directamente", Icon: MessageSquare },
  { label: "Colabora", href: "/colabora", desc: "Unete como freelance, partner o agencia", Icon: Briefcase },
];

// ─── Simple links en header (depues del search) ───────────────────
export const primaryLinks = [
  { href: "/planes", label: "Planes" },
  { href: "/casos", label: "Casos" },
  { href: "/blog", label: "Blog" },
];

// ─── Footer mega con 5 columnas ───────────────────────────────────
export const footerColumns: MenuGroup[] = [
  {
    title: "Por industria",
    items: verticalMenu.map((v) => ({ label: v.label.replace("PACAME ", ""), href: v.href })),
  },
  {
    title: "Productos",
    items: [
      { label: "Marketplace servicios", href: "/servicios" },
      { label: "Planes mensuales", href: "/planes" },
      { label: "Apps productizadas", href: "/apps" },
      { label: "Games & experiencias", href: "/games" },
      { label: "Auditoria gratis", href: "/auditoria" },
    ],
  },
  {
    title: "Recursos",
    items: [
      { label: "Blog", href: "/blog" },
      { label: "Casos de exito", href: "/casos" },
      { label: "Calculadora ROI", href: "/calculadora-roi" },
      { label: "7 errores comunes", href: "/7-errores" },
      { label: "Refiere y gana", href: "/refiere" },
    ],
  },
  {
    title: "Empresa",
    items: [
      { label: "Equipo", href: "/equipo" },
      { label: "Agentes IA", href: "/agentes" },
      { label: "Contacto", href: "/contacto" },
      { label: "Colabora", href: "/colabora" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacidad", href: "/privacidad" },
      { label: "Terminos", href: "/terminos-servicio" },
      { label: "Cookies", href: "/cookies" },
      { label: "Aviso legal", href: "/aviso-legal" },
      { label: "Accesibilidad", href: "/accesibilidad" },
    ],
  },
];
