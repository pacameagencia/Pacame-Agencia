import Link from "next/link";
import {
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
  Award,
  Zap,
  CreditCard,
  Lock,
} from "lucide-react";
import NewsletterForm from "@/components/NewsletterForm";
import { footerColumns } from "@/lib/data/nav-menu";

const social = [
  { label: "Instagram", href: "https://instagram.com/pacameagencia", Icon: Instagram },
  { label: "LinkedIn", href: "https://linkedin.com/company/pacame", Icon: Linkedin },
  { label: "YouTube", href: "https://youtube.com/@pacameagencia", Icon: Youtube },
  { label: "WhatsApp", href: "https://wa.me/34722669381", Icon: MessageCircle },
  { label: "Email", href: "mailto:hola@pacameagencia.com", Icon: Mail },
  { label: "Telegram", href: "https://t.me/pacameagencia", Icon: Send },
];

const trustSignals = [
  { Icon: ShieldCheck, label: "GDPR compliant", sub: "LOPDGDD certificado" },
  { Icon: Lock, label: "SSL + TLS 1.3", sub: "Cifrado bancario" },
  { Icon: CreditCard, label: "Stripe Verified", sub: "Pagos seguros" },
  { Icon: Award, label: "4.9/5 rating", sub: "47 clientes activos" },
  { Icon: Zap, label: "Entrega en horas", sub: "Velocidad IA" },
];

export default function Footer() {
  return (
    <footer className="relative bg-paper border-t border-ink/[0.05] mt-20">
      {/* Top glow divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />

      {/* Newsletter CTA — full width editorial */}
      <div className="border-b border-ink/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent-gold mb-3">
              Newsletter semanal · Gratis · Sin spam
            </div>
            <h3 className="font-heading font-bold text-3xl md:text-4xl text-ink leading-tight mb-3">
              Recibe <span className="text-accent-gold">consejos digitales</span>{" "}
              cada martes
            </h3>
            <p className="text-ink/60 font-body text-base md:text-lg leading-relaxed max-w-xl">
              Guias practicas de SEO, Ads, Web y IA que aplicamos en los 47+ clientes
              PACAME. Cancela cuando quieras.
            </p>
          </div>
          <div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Trust signals bar */}
      <div className="border-b border-ink/[0.05] bg-ink/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
            {trustSignals.map(({ Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-accent-gold" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-heading font-semibold text-ink leading-tight">
                    {label}
                  </div>
                  <div className="text-[11px] text-ink/40 font-body leading-tight">
                    {sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-column sitemap */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <defs>
                  <linearGradient id="footer-logo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2872A1" />
                    <stop offset="50%" stopColor="#F1E194" />
                    <stop offset="100%" stopColor="#5B0E14" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#footer-logo)" />
                <path d="M10 24V8H17C19.76 8 22 10.24 22 13C22 15.76 19.76 18 17 18H14.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className="font-heading font-bold text-xl text-ink tracking-tight">
                PACAME
              </span>
            </Link>
            <p className="text-[13px] text-ink/60 font-body leading-relaxed mb-5 max-w-[280px]">
              Tu equipo digital completo. 10 agentes IA + 120 sub-especialistas
              supervisados por Pablo Calleja. Entrega en horas. Sin contratos de
              permanencia. Sin humo.
            </p>
            <div className="flex items-center gap-2">
              {social.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-ink/5 border border-ink/10 hover:bg-accent-gold/10 hover:border-accent-gold/30 text-ink/60 hover:text-accent-gold flex items-center justify-center transition-all"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Sitemap columns from data */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink/40 mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-[13px] text-ink/60 hover:text-accent-gold transition-colors font-body"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ink/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px] font-body text-ink/40">
          <div className="flex items-center gap-4 flex-wrap">
            <span>© 2026 PACAME · Pablo Calleja</span>
            <span className="hidden md:inline">·</span>
            <span>Madrid · Made with care &amp; coffee</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-ink/70 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos-servicio" className="hover:text-ink/70 transition-colors">
              Terminos
            </Link>
            <Link href="/cookies" className="hover:text-ink/70 transition-colors">
              Cookies
            </Link>
            <Link href="/status" className="hover:text-ink/70 transition-colors inline-flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              Status operativo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
