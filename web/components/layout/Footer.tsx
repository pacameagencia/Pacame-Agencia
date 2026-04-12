import Link from "next/link";
import { Zap, Twitter, Linkedin, Instagram, Mail } from "lucide-react";

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
    { label: "Política de privacidad", href: "/privacidad" },
    { label: "Aviso legal", href: "/aviso-legal" },
    { label: "Cookies", href: "/cookies" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-dark-elevated border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-heading font-bold text-xl text-pacame-white">PACAME</span>
            </Link>
            <p className="text-pacame-white/50 text-sm leading-relaxed max-w-xs mb-6">
              Tu equipo digital completo. Agentes IA especializados, liderados por humanos.
              Más rápido, mejor y más barato.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/pacameagencia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-pacame-white/50 hover:text-pacame-white hover:bg-white/10 hover:border-white/20 transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/pacame"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-pacame-white/50 hover:text-pacame-white hover:bg-white/10 hover:border-white/20 transition-all"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/pacameagencia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-pacame-white/50 hover:text-pacame-white hover:bg-white/10 hover:border-white/20 transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:hola@pacameagencia.com"
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-pacame-white/50 hover:text-pacame-white hover:bg-white/10 hover:border-white/20 transition-all"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-pacame-white mb-4 uppercase tracking-widest">
              Servicios
            </h4>
            <ul className="space-y-3">
              {footerLinks.servicios.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-pacame-white/50 hover:text-pacame-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-pacame-white mb-4 uppercase tracking-widest">
              Empresa
            </h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-pacame-white/50 hover:text-pacame-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Herramientas */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-pacame-white mb-4 uppercase tracking-widest">
              Gratis
            </h4>
            <ul className="space-y-3">
              {footerLinks.herramientas.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-pacame-white/50 hover:text-pacame-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-pacame-white mb-4 uppercase tracking-widest">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-sm text-pacame-white/50 hover:text-pacame-white transition-colors"
                >
                  hola@pacameagencia.com
                </a>
              </li>
              <li className="text-sm text-pacame-white/50">
                Madrid, España
              </li>
              <li className="pt-2">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-xs text-pacame-white/30 hover:text-pacame-white/60 transition-colors mb-2"
                  >
                    {link.label}
                  </Link>
                ))}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-pacame-white/30">
            © {new Date().getFullYear()} PACAME. Todos los derechos reservados.
          </p>
          <p className="text-xs text-pacame-white/30">
            Tu equipo digital. Sin límites.
          </p>
        </div>
      </div>
    </footer>
  );
}
