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

// ─── Sub-personas por vertical (24 items = 3 × 8 verticales) ─────
// Usado en mega-menu "Soluciones" — desktop hover muestra las 3 personas
// top del vertical + link "Ver ficha vertical completa".
export interface PersonaMenuEntry {
  vertical_slug: string;
  vertical_label: string;
  vertical_icon?: LucideIcon;
  personas: Array<{
    persona_slug: string;
    name: string;
    emoji?: string;
    kicker?: string; // "DESDE X€ · Y DIAS"
  }>;
}

export const personasMenu: PersonaMenuEntry[] = [
  {
    vertical_slug: "restaurante",
    vertical_label: "Restaurante",
    vertical_icon: Utensils,
    personas: [
      { persona_slug: "dueno-restaurante", name: "Dueño restaurante", emoji: "🍽️", kicker: "DESDE 1.499€ · 14 DIAS" },
      { persona_slug: "bar-cafeteria", name: "Bar / Cafeteria", emoji: "☕", kicker: "DESDE 899€ · 10 DIAS" },
      { persona_slug: "food-truck", name: "Food Truck", emoji: "🚚", kicker: "DESDE 799€ · 10 DIAS" },
    ],
  },
  {
    vertical_slug: "hotel",
    vertical_label: "Hotel",
    vertical_icon: Bed,
    personas: [
      { persona_slug: "hotel-boutique", name: "Hotel boutique", emoji: "🏨", kicker: "DESDE 3.499€ · 21 DIAS" },
      { persona_slug: "hostel", name: "Hostel / Albergue", emoji: "🛏️", kicker: "DESDE 1.799€ · 14 DIAS" },
      { persona_slug: "apartamentos-turisticos", name: "Airbnb owner", emoji: "🔑", kicker: "DESDE 2.499€ · 18 DIAS" },
    ],
  },
  {
    vertical_slug: "clinica",
    vertical_label: "Clinica",
    vertical_icon: Stethoscope,
    personas: [
      { persona_slug: "clinica-privada", name: "Clinica privada", emoji: "🏥", kicker: "DESDE 2.199€ · 18 DIAS" },
      { persona_slug: "dentista", name: "Clinica dental", emoji: "🦷", kicker: "DESDE 1.999€ · 18 DIAS" },
      { persona_slug: "fisioterapeuta", name: "Fisioterapeuta", emoji: "🦴", kicker: "DESDE 1.399€ · 14 DIAS" },
    ],
  },
  {
    vertical_slug: "gym",
    vertical_label: "Gym",
    vertical_icon: Dumbbell,
    personas: [
      { persona_slug: "gimnasio", name: "Gimnasio", emoji: "🏋️", kicker: "DESDE 2.699€ · 21 DIAS" },
      { persona_slug: "entrenador-personal", name: "Entrenador personal", emoji: "💪", kicker: "DESDE 1.299€ · 12 DIAS" },
      { persona_slug: "crossfit-box", name: "CrossFit box", emoji: "🔥", kicker: "DESDE 1.899€ · 16 DIAS" },
    ],
  },
  {
    vertical_slug: "inmobiliaria",
    vertical_label: "Inmobiliaria",
    vertical_icon: HomeIcon,
    personas: [
      { persona_slug: "inmobiliaria", name: "Agencia inmobiliaria", emoji: "🏢", kicker: "DESDE 3.999€ · 28 DIAS" },
      { persona_slug: "dueno-airbnb", name: "Dueño Airbnb", emoji: "🔑", kicker: "DESDE 2.499€ · 18 DIAS" },
      { persona_slug: "promotor", name: "Promotor obra nueva", emoji: "🏗️", kicker: "DESDE 5.999€ · 35 DIAS" },
    ],
  },
  {
    vertical_slug: "ecommerce",
    vertical_label: "Shop",
    vertical_icon: ShoppingBag,
    personas: [
      { persona_slug: "tienda-online", name: "Tienda DTC", emoji: "🛍️", kicker: "DESDE 2.999€ · 21 DIAS" },
      { persona_slug: "dropshipping", name: "Dropshipping", emoji: "📦", kicker: "DESDE 1.899€ · 16 DIAS" },
      { persona_slug: "marketplace-seller", name: "Marketplace seller", emoji: "🏪", kicker: "DESDE 1.599€ · 14 DIAS" },
    ],
  },
  {
    vertical_slug: "formacion",
    vertical_label: "Academy",
    vertical_icon: GraduationCap,
    personas: [
      { persona_slug: "academia", name: "Academia", emoji: "🎓", kicker: "DESDE 1.799€ · 16 DIAS" },
      { persona_slug: "coach-solo", name: "Coach individual", emoji: "🧑‍🏫", kicker: "DESDE 1.199€ · 12 DIAS" },
      { persona_slug: "universidad", name: "Universidad / MBA", emoji: "🎓", kicker: "DESDE 5.999€ · 42 DIAS" },
    ],
  },
  {
    vertical_slug: "saas",
    vertical_label: "Core (SaaS)",
    vertical_icon: Zap,
    personas: [
      { persona_slug: "early-stage", name: "Early-stage", emoji: "🚀", kicker: "DESDE 2.999€ · 24 DIAS" },
      { persona_slug: "scaleup", name: "Scale-up (Serie A-B)", emoji: "📈", kicker: "DESDE 4.999€ · 35 DIAS" },
      { persona_slug: "enterprise", name: "Enterprise (Serie C+)", emoji: "🏛️", kicker: "DESDE 9.999€ · 56 DIAS" },
    ],
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
  { label: "Encuentra tu solucion", href: "/encuentra-tu-solucion", desc: "Quiz 2 min que te recomienda bundle personalizado", Icon: Target, kicker: "2 MIN · NUEVO", badge: "Nuevo" },
  { label: "Auditoria gratis", href: "/auditoria", desc: "Te decimos en 10 min donde pierdes trafico", Icon: Lightbulb, kicker: "GRATIS" },
  { label: "Calculadora ROI", href: "/calculadora-roi", desc: "Simula tu retorno antes de contratar", Icon: BarChart3 },
  { label: "7 errores comunes", href: "/7-errores", desc: "Los fallos digitales mas caros para PYMEs", Icon: FileText },
  { label: "Blog", href: "/blog", desc: "Guias practicas de SEO, Ads, Web y IA", Icon: BookOpen },
  { label: "Casos de exito", href: "/casos", desc: "Historias reales con numeros", Icon: Award },
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
