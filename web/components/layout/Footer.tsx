import Link from "next/link";
import { Zap } from "lucide-react";

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
  ],
};

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-body text-xs font-semibold text-pacame-white/30 uppercase tracking-[0.15em] mb-5">
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
    <footer className="bg-[#0A0A0A] border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        {/* Top section - brand + links */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-20">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="font-heading font-bold text-lg text-pacame-white">PACAME</span>
            </Link>
            <p className="text-[15px] text-pacame-white/40 leading-relaxed max-w-xs mb-8">
              Tu equipo digital completo. Agentes IA especializados, liderados por humanos.
            </p>
            <div className="flex items-center gap-5">
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
                  className="text-xs text-pacame-white/30 hover:text-pacame-white transition-colors duration-300"
                  aria-label={social.label}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Servicios" links={footerLinks.servicios} />
          <FooterColumn title="Empresa" links={footerLinks.empresa} />
          <FooterColumn title="Gratis" links={footerLinks.herramientas} />

          {/* Contact */}
          <div>
            <h4 className="font-body text-xs font-semibold text-pacame-white/30 uppercase tracking-[0.15em] mb-5">
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
              <li className="text-sm text-pacame-white/30">
                Madrid, Espana
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-pacame-white/20">
            &copy; {new Date().getFullYear()} PACAME. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-pacame-white/20 hover:text-pacame-white/50 transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
