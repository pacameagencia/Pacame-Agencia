"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  Bell,
  FileText,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
} from "lucide-react";

const NAV = [
  { label: "Resumen", href: "/app/asesor-pro", icon: LayoutDashboard },
  { label: "Pipeline", href: "/app/asesor-pro/pipeline", icon: Kanban },
  { label: "Clientes", href: "/app/asesor-pro/clientes", icon: Users },
  { label: "Facturas", href: "/app/asesor-pro/facturas", icon: FileText },
  { label: "Gastos", href: "/app/asesor-pro/gastos", icon: Receipt },
  { label: "Alertas", href: "/app/asesor-pro/alertas", icon: Bell },
  { label: "Ajustes", href: "/app/asesor-pro/ajustes", icon: Settings },
];

interface Props {
  children: React.ReactNode;
  user: { id: string; email: string; full_name: string | null };
  subscription: { tier: string; status: string; trial_ends_at: string | null };
  trialDaysLeft: number | null;
}

export default function AppShell({ children, user, subscription, trialDaysLeft }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/products/auth/logout", { method: "POST" });
    router.push("/p/asesor-pro");
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-ink border-r-2 border-ink transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-paper/10">
          <Link href="/app/asesor-pro" className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center" style={{ background: "#283B70" }}>
              <span className="font-display text-paper text-lg" style={{ fontWeight: 500 }}>A</span>
            </div>
            <div className="leading-none">
              <span className="font-display font-medium text-paper text-base block">AsesorPro</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-paper/50 mt-0.5 block">
                · PACAME
              </span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-paper/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app/asesor-pro" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-sans transition-all ${
                  isActive
                    ? "bg-paper/10 text-paper font-medium border-l-2 border-mustard-500"
                    : "text-paper/60 hover:text-paper hover:bg-paper/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-paper/10">
          <div className="mb-3 text-[11px] font-mono text-paper/50 truncate">
            {user.full_name ?? user.email}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-paper/40">
            Plan {subscription.tier}
          </div>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-[12px] text-paper/40 hover:text-rose-alert transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-paper border-b-2 border-ink flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-ink/60">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {trialDaysLeft !== null && trialDaysLeft >= 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-mustard-500/15 border border-mustard-500/30 text-ink">
              <Clock className="w-3.5 h-3.5 text-mustard-700" />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink">
                Trial · {trialDaysLeft} día{trialDaysLeft === 1 ? "" : "s"} restante{trialDaysLeft === 1 ? "" : "s"}
              </span>
              <Link
                href="/app/asesor-pro/ajustes/plan"
                className="ml-2 font-mono text-[11px] tracking-[0.15em] uppercase text-terracotta-500 hover:text-terracotta-600"
              >
                Activar →
              </Link>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
