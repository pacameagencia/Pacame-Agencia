"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard/referrals-admin", label: "Resumen" },
  { href: "/dashboard/referrals-admin/affiliates", label: "Afiliados" },
  { href: "/dashboard/referrals-admin/tracking", label: "Tracking" },
  { href: "/dashboard/referrals-admin/commissions", label: "Comisiones" },
  { href: "/dashboard/referrals-admin/content", label: "Contenido" },
  { href: "/dashboard/referrals-admin/configuracion", label: "Configuración" },
];

export default function ReferralsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-medium text-ink">Programa de afiliados</h1>
        <p className="mt-1 text-sm text-ink/60">
          Tracking, comisiones y biblioteca de contenido — control total del programa.
        </p>
      </header>
      <nav role="tablist" className="flex flex-wrap gap-1 border-b border-ink/10">
        {TABS.map((t) => {
          const isActive =
            t.href === "/dashboard/referrals-admin"
              ? pathname === t.href
              : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={isActive}
              className={
                "px-4 py-2 text-sm font-medium transition border-b-2 -mb-px " +
                (isActive
                  ? "text-terracotta-500 border-terracotta-500"
                  : "text-ink/60 border-transparent hover:text-ink")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
