import Link from "next/link";

const footerLinks = {
  servicios: [
    { label: "Desarrollo Web", href: "/servicios#web" },
    { label: "SEO", href: "/servicios#seo" },
    { label: "Redes Sociales", href: "/servicios#redes" },
    { label: "Publicidad Digital", href: "/servicios#ads" },
    { label: "Branding", href: "/servicios#branding" },
  ],
  herramientas: [
    { label: "Auditoría Web Gratis", href: "/auditoria" },
    { label: "Calculadora ROI", href: "/calculadora-roi" },
    { label: "7 Errores de tu Web", href: "/7-errores" },
  ],
  sectores: [
    { label: "Restaurantes", href: "/para/restaurantes" },
    { label: "Clínicas", href: "/para/clinicas" },
    { label: "Abogados", href: "/para/abogados" },
    { label: "Tiendas", href: "/para/tiendas" },
  ],
  empresa: [
    { label: "El equipo", href: "/equipo" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Diario", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Colabora", href: "/colabora" },
    { label: "Contacto", href: "/contacto" },
  ],
  legal: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Aviso legal", href: "/aviso-legal" },
    { label: "Cookies", href: "/cookies" },
    { label: "Términos", href: "/terminos-servicio" },
    { label: "Accesibilidad", href: "/accesibilidad" },
  ],
};

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-mono text-[10px] font-medium tracking-[0.3em] uppercase text-mustard-500 mb-6">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[15px] text-paper/70 hover:text-terracotta-300 transition-colors duration-300 font-sans"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="#F4EFE3" strokeWidth="1.5" opacity="0.9" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="#E8B730" strokeWidth="1" />
      <path d="M20 6 L22 17 L33 20 L22 23 L20 34 L18 23 L7 20 L18 17 Z" fill="#E8B730" />
      <circle cx="20" cy="20" r="2" fill="#B54E30" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink text-paper relative overflow-hidden" role="contentinfo">
      {/* Azulejo pattern overlay sutil */}
      <div className="absolute inset-0 bg-azulejo opacity-[0.04] pointer-events-none" />

      {/* Borde superior con forma */}
      <div className="relative">
        <svg className="w-full h-12 text-paper" viewBox="0 0 1200 48" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 48 L0 24 Q100 0 200 24 T400 24 T600 24 T800 24 T1000 24 T1200 24 L1200 48 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-10 relative">
        {/* ── Top masthead editorial ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-20 pb-8 border-b border-paper/20">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <FooterMark />
              <div>
                <h2 className="font-display font-medium text-4xl tabular-nums" style={{ fontVariationSettings: '"SOFT" 50, "WONK" 1, "opsz" 144' }}>
                  PACAME
                </h2>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-paper/50 mt-1">
                  Diario Nº 001 · Primavera 2026 · Madrid
                </p>
              </div>
            </div>
            <p className="font-display italic text-xl text-paper/70 max-w-lg leading-snug" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}>
              Siete especialistas de inteligencia artificial.
              <br />
              Un humano. Tu empresa, al día.
            </p>
          </div>

          {/* Newsletter signup — estilo formulario editorial */}
          <div className="mt-10 md:mt-0 md:max-w-sm w-full">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-mustard-500 mb-3">
              Suscripción al Diario
            </p>
            <form className="flex gap-2" action="/api/newsletter" method="post">
              <input
                type="email"
                name="email"
                required
                placeholder="tu@email.com"
                className="flex-1 bg-transparent border-b-2 border-paper/40 text-paper placeholder:text-paper/30 font-sans text-sm py-2 focus:outline-none focus:border-mustard-500 transition-colors"
                aria-label="Correo electrónico"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-mustard-500 text-ink font-sans font-medium text-sm rounded-sm hover:bg-mustard-600 transition-colors"
                style={{ boxShadow: "3px 3px 0 #F4EFE3" }}
              >
                Suscríbeme
              </button>
            </form>
            <p className="font-mono text-[10px] text-paper/40 mt-3">
              Un correo por mes. Nada de spam. Baja cuando quieras.
            </p>
          </div>
        </div>

        {/* ── Columnas ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <FooterColumn title="Servicios" links={footerLinks.servicios} />
          <FooterColumn title="Sectores" links={footerLinks.sectores} />
          <FooterColumn title="Empresa" links={footerLinks.empresa} />
          <FooterColumn title="Gratis" links={footerLinks.herramientas} />
          <div>
            <h4 className="font-mono text-[10px] font-medium tracking-[0.3em] uppercase text-mustard-500 mb-6">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-[15px] text-paper/70 hover:text-terracotta-300 transition-colors duration-300 font-sans"
                >
                  hola@pacameagencia.com
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/34722669381"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] text-paper/70 hover:text-terracotta-300 transition-colors duration-300 font-sans"
                >
                  +34 722 669 381
                </a>
              </li>
              <li className="text-[15px] text-paper/70 font-sans">
                Madrid, España
              </li>
              <li className="text-[13px] text-paper/50 font-mono mt-4 tracking-wide">
                Fundador: Pablo Calleja
              </li>
            </ul>
          </div>
        </div>

        {/* ── Copy + social + legal (pie de libro) ── */}
        <div className="pt-8 border-t border-paper/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Redes */}
            <nav aria-label="Redes sociales" className="flex items-center gap-6 order-2 md:order-1">
              {[
                { label: "X", href: "https://twitter.com/pacameagencia" },
                { label: "LinkedIn", href: "https://linkedin.com/company/pacame" },
                { label: "Instagram", href: "https://instagram.com/pacameagencia" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] tracking-[0.25em] uppercase text-paper/50 hover:text-mustard-500 transition-colors duration-300"
                  aria-label={s.label}
                >
                  {s.label}
                </a>
              ))}
            </nav>

            {/* Copy */}
            <p className="font-mono text-[10px] tracking-widest uppercase text-paper/40 order-1 md:order-2">
              © {new Date().getFullYear()} PACAME · Impreso en España
            </p>

            {/* Legal */}
            <div className="flex items-center gap-5 order-3 flex-wrap justify-center">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-mono text-[10px] tracking-widest uppercase text-paper/40 hover:text-paper/80 transition-colors duration-300"
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
