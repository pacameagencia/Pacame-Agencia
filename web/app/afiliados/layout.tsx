import Link from "next/link";

export const metadata = {
  title: "Programa de afiliados PACAME — gana 20% durante 12 meses",
  description:
    "Recomienda PACAME y gana 20% de comisión recurrente durante 12 meses por cada cliente que pague. Sin tope de ingresos, sin permanencia, biblioteca de contenido lista para vender.",
};

export default function AfiliadosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/afiliados" className="font-heading text-xl tracking-tight">
            PACAME · <span className="text-terracotta-500">afiliados</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/afiliados" className="text-ink/70 hover:text-ink">
              Programa
            </Link>
            <Link href="/afiliados/login" className="text-ink/70 hover:text-ink">
              Acceder
            </Link>
            <Link
              href="/afiliados/registro"
              className="rounded-sm bg-terracotta-500 px-4 py-1.5 text-paper hover:bg-terracotta-600"
            >
              Únete gratis
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-ink/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>© PACAME Agencia Digital · hola@pacameagencia.com · WhatsApp +34 722 669 381</span>
            <div className="flex gap-4">
              <Link href="/afiliados" className="hover:text-ink">Programa</Link>
              <Link href="/afiliados/login" className="hover:text-ink">Acceder</Link>
              <Link href="/" className="hover:text-ink">Web principal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
