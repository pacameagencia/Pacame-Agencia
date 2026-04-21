"use client";

/**
 * Breadcrumbs automaticas — se renderizan en cualquier pagina interna
 * basandose en el pathname. Nivel Amazon/Adobe para orientacion.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

// Mapeo de segment de URL → label humano
const LABELS: Record<string, string> = {
  servicios: "Servicios",
  portafolio: "Portfolio",
  restaurante: "PACAME Restaurante",
  hotel: "PACAME Hotel",
  clinica: "PACAME Clinica",
  gym: "PACAME Gym",
  inmobiliaria: "PACAME Inmo",
  ecommerce: "PACAME Shop",
  formacion: "PACAME Academy",
  saas: "PACAME Core",
  apps: "Apps",
  planes: "Planes",
  casos: "Casos de exito",
  blog: "Blog",
  contacto: "Contacto",
  colabora: "Colabora",
  equipo: "Equipo",
  agentes: "Agentes IA",
  auditoria: "Auditoria gratis",
  "calculadora-roi": "Calculadora ROI",
  "7-errores": "7 errores comunes",
  refiere: "Refiere y gana",
  games: "Games",
  privacidad: "Privacidad",
  "terminos-servicio": "Terminos",
  cookies: "Cookies",
  "aviso-legal": "Aviso legal",
  accesibilidad: "Accesibilidad",
  status: "Status",
  review: "Dejar review",
  comprar: "Comprar",
  gracias: "Gracias",
};

function humanize(segment: string): string {
  if (LABELS[segment]) return LABELS[segment];
  // Slug dinamico: convierte "mi-producto-slug" → "Mi producto slug"
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  // No renderizar en home, dashboard, portal, login, ni en paginas transitorias (checkout + confirmacion)
  if (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/nps") ||
    pathname.startsWith("/gracias") ||
    pathname.startsWith("/comprar")
  ) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = humanize(decodeURIComponent(segment));
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  // Structured data para SEO (BreadcrumbList schema)
  const itemListElement = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://pacameagencia.com/",
    },
    ...crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 2,
      name: c.label,
      item: `https://pacameagencia.com${c.href}`,
    })),
  ];

  return (
    <>
      <nav
        className="pt-24 pb-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-1.5 text-[12px] font-body text-ink/50 flex-wrap">
          <li>
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-accent-gold transition-colors"
              aria-label="Home"
            >
              <Home className="w-3 h-3" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="inline-flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-ink/30" />
              {crumb.isLast ? (
                <span className="text-ink font-medium" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-accent-gold transition-colors truncate max-w-[180px]"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement,
          }),
        }}
      />
    </>
  );
}
