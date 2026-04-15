import Link from "next/link";
import GoldenDivider from "@/components/effects/GoldenDivider";
import TrustBadges from "@/components/TrustBadges";

const footerLinks = {
  servicios: [
    { label: "Desarrollo Web", href: "/servicios#web" },
    { label: "SEO", href: "/servicios#seo" },
    { label: "Redes Sociales", href: "/servicios#redes" },
    { label: "Publicidad Digital", href: "/servicios#ads" },
    { label: "Branding", href: "/servicios#branding" },
  ],
  herramientas: [
    { label: "Auditoria Web Gratis", href: "/auditoria" },
    { label: "Calculadora ROI", href: "/calculadora-roi" },
    { label: "7 Errores de tu Web", href: "/7-errores" },
  ],
  sectores: [
    { label: "Restaurantes", href: "/para/restaurantes" },
    { label: "Clinicas", href: "/para/clinicas" },
    { label: "Abogados", href: "/para/abogados" },
    { label: "Tiendas", href: "/para/tiendas" },
  ],
  empresa: [
    { label: "El equipo", href: "/equipo" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Colabora", href: "/colabora" },
    { label: "Contacto", href: "/contacto" },
  ],
  legal: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Aviso legal", href: "/aviso-legal" },
    { label: "Cookies", href: "/cookies" },
    { label: "Terminos", href: "/terminos-servicio" },
    { label: "Accesibilidad", href: "/accesibilidad" },
  ],
};

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-body text-xs font-semibold text-olympus-gold/60 uppercase tracking-[0.15em] mb-5">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-pacame-white/50 hover:text-pacame-white transition-colors duration-300"
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
      {/* Golden divider instead of plain border */}
      <div className="px-6">
        <GoldenDivider variant="star" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        {/* Top section - brand + links */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-10 mb-20">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <defs>
                  <linearGradient id="footer-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="50%" stopColor="#D4A853" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                <rect width="28" height="28" rx="7" fill="url(#footer-logo-grad)" />
                <path d="M9 21V7H14.5C17 7 19 9 19 11.5C19 14 17 16 14.5 16H12.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <circle cx="20" cy="8" r="1" fill="white" opacity="0.6" />
                <circle cx="22" cy="12" r="0.7" fill="white" opacity="0.4" />
              </svg>
              <span className="font-heading font-bold text-lg text-pacame-white">PACAME</span>
            </Link>
            <p className="text-[15px] text-pacame-white/60 leading-relaxed max-w-xs mb-8">
              Tu equipo digital completo. Agentes IA especializados, liderados por humanos.
            </p>
            <nav aria-label="Redes sociales" className="flex items-center gap-5">
              {[
                { label: "X", href: "https://twitter.com/pacameagencia" },
                { label: "LinkedIn", href: "https://linkedin.com/company/pacame" },
                { label: "Instagram", href: "https://instagram.com/pacameagencia" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-pacame-white/50 hover:text-olympus-gold transition-colors duration-300"
                  aria-label={social.label}
                >
                  {social.label}
                </a>
              ))}
            </nav>
          </div>

          <FooterColumn title="Servicios" links={footerLinks.servicios} />
          <FooterColumn title="Sectores" links={footerLinks.sectores} />
          <FooterColumn title="Empresa" links={footerLinks.empresa} />
          <FooterColumn title="Gratis" links={footerLinks.herramientas} />

          {/* Contact */}
          <div>
            <h4 className="font-body text-xs font-semibold text-olympus-gold/60 uppercase tracking-[0.15em] mb-5">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-sm text-pacame-white/50 hover:text-pacame-white transition-colors duration-300"
                >
                  hola@pacameagencia.com
                </a>
              </li>
              <li className="text-sm text-pacame-white/50">
                Madrid, Espana
              </li>
              <li className="text-sm text-pacame-white/35 mt-2">
                Pablo Calleja Mena
              </li>
              {/* NIF: se anadira cuando Pablo lo proporcione */}
            </ul>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mb-10 pt-8 relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/10 to-transparent" />
          <TrustBadges variant="footer" />
        </div>

        {/* Bottom bar */}
        <div className="pt-8 relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/10 to-transparent" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-pacame-white/40">
              &copy; {new Date().getFullYear()} PACAME. Forjado en el Olimpo Digital.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-pacame-white/40 hover:text-pacame-white/70 transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
