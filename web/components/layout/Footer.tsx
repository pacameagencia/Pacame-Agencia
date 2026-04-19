import Link from "next/link";
import {
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import NewsletterForm from "@/components/NewsletterForm";

// Footer enterprise — Stripe/Amazon pattern con 5 columnas + newsletter + legal bar
const footerGroups = {
  Producto: [
    { label: "Marketplace servicios", href: "/servicios" },
    { label: "Apps productizadas", href: "/apps" },
    { label: "Planes mensuales", href: "/planes" },
    { label: "Paquetes combinados", href: "/servicios#paquetes" },
    { label: "Para agencias", href: "/colabora" },
  ],
  Empresa: [
    { label: "El equipo", href: "/equipo" },
    { label: "Blog", href: "/blog" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Contacto", href: "/contacto" },
    { label: "Partners", href: "/colabora" },
  ],
  Recursos: [
    { label: "Auditoria gratis", href: "/auditoria" },
    { label: "Calculadora ROI", href: "/calculadora-roi" },
    { label: "7 errores de tu web", href: "/7-errores" },
    { label: "FAQ", href: "/faq" },
    { label: "Docs API", href: "/docs" },
  ],
  Legal: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Terminos", href: "/terminos-servicio" },
    { label: "Cookies", href: "/cookies" },
    { label: "Aviso legal", href: "/aviso-legal" },
    { label: "Accesibilidad", href: "/accesibilidad" },
  ],
};

const socials = [
  { label: "LinkedIn", href: "https://linkedin.com/company/pacame", Icon: Linkedin },
  { label: "X / Twitter", href: "https://twitter.com/pacameagencia", Icon: Send },
  { label: "Instagram", href: "https://instagram.com/pacameagencia", Icon: Instagram },
  { label: "TikTok", href: "https://tiktok.com/@pacameagencia", Icon: MessageCircle },
  { label: "YouTube", href: "https://youtube.com/@pacameagencia", Icon: Youtube },
];

function PacameLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient
          id="footer-logo-grad"
          x1="0"
          y1="0"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#D4A853" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#footer-logo-grad)" />
      <path
        d="M9 21V7H14.5C17 7 19 9 19 11.5C19 14 17 16 14.5 16H12.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="8" r="1" fill="white" opacity="0.6" />
      <circle cx="22" cy="12" r="0.7" fill="white" opacity="0.4" />
    </svg>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-body text-[11px] font-semibold text-olympus-gold/80 uppercase tracking-[0.18em] mb-5">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-pacame-white/55 hover:text-pacame-white transition-colors duration-300"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] relative" role="contentinfo">
      {/* Top golden hairline */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/30 to-transparent" />

      {/* Newsletter strip — sobre el footer */}
      <div className="border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-accent font-bold text-2xl sm:text-3xl text-pacame-white mb-2 text-balance">
                Recibe <span className="gradient-text-gold">consejos digitales</span>{" "}
                cada semana
              </h3>
              <p className="text-sm text-pacame-white/50 font-body max-w-md">
                Guias practicas de SEO, Ads, Web y RRSS para PYMEs. Sin spam, cancela cuando quieras.
              </p>
            </div>
            <div className="md:pl-8">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-14">
          {/* Brand col — 2 wide */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <PacameLogo />
              <span className="font-heading font-bold text-lg text-pacame-white">
                PACAME
              </span>
            </Link>
            <p className="text-[15px] text-pacame-white/55 leading-relaxed max-w-xs mb-6">
              Tu equipo digital completo. 10 agentes IA + 120 subespecialistas, liderados por humanos.
            </p>

            {/* Contact direct */}
            <ul className="space-y-2 mb-6">
              <li>
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="inline-flex items-center gap-2 text-sm text-pacame-white/55 hover:text-pacame-white transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-olympus-gold/60" />
                  hola@pacameagencia.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/34722669381"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-pacame-white/55 hover:text-pacame-white transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-olympus-gold/60" />
                  WhatsApp +34 722 669 381
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/pacameagencia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-pacame-white/55 hover:text-pacame-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-olympus-gold/60" />
                  Telegram @pacameagencia
                </a>
              </li>
            </ul>

            {/* Socials */}
            <nav aria-label="Redes sociales" className="flex items-center gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-white/[0.08] flex items-center justify-center text-pacame-white/50 hover:text-olympus-gold hover:border-olympus-gold/30 transition-all duration-300"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </nav>
          </div>

          <FooterColumn title="Producto" links={footerGroups.Producto} />
          <FooterColumn title="Empresa" links={footerGroups.Empresa} />
          <FooterColumn title="Recursos" links={footerGroups.Recursos} />
          <FooterColumn title="Legal" links={footerGroups.Legal} />
        </div>

        {/* Bottom bar — copyright + badges + social row */}
        <div className="pt-8 border-t border-white/[0.05]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Copyright + location */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-2">
              <p className="text-xs text-pacame-white/40 font-body">
                &copy; {new Date().getFullYear()} PACAME. Todos los derechos reservados.
              </p>
              <p className="text-xs text-pacame-white/40 font-body">
                Pablo Calleja Mena · Madrid, Espana
              </p>
            </div>

            {/* Trust badges mini */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-body text-pacame-white/45">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-olympus-gold/60" />
                Stripe Verified
              </span>
              <span className="text-pacame-white/15">·</span>
              <span>GDPR compliant</span>
              <span className="text-pacame-white/15">·</span>
              <span className="inline-flex items-center gap-1">
                Made in Spain
                <span role="img" aria-label="flag Spain">
                  🇪🇸
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
