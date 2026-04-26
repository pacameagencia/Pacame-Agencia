"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/afiliados/panel", label: "Resumen" },
  { href: "/afiliados/panel/referidos", label: "Referidos" },
  { href: "/afiliados/panel/comisiones", label: "Comisiones" },
  { href: "/afiliados/panel/contenido", label: "Contenido para vender" },
  { href: "/afiliados/panel/perfil", label: "Perfil y cobro" },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/referrals/public/logout", { method: "POST", credentials: "include" });
    router.push("/afiliados/login");
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/afiliados/panel" className="font-heading text-xl tracking-tight">
            PACAME · <span className="text-terracotta-500">afiliados</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-sm border border-ink/15 px-3 py-1.5 text-sm text-ink/70 hover:bg-ink/5"
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
          {TABS.map((t) => {
            const isActive =
              t.href === "/afiliados/panel"
                ? pathname === t.href
                : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "shrink-0 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px " +
                  (isActive
                    ? "text-terracotta-500 border-terracotta-500"
                    : "text-ink/60 border-transparent hover:text-ink")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
