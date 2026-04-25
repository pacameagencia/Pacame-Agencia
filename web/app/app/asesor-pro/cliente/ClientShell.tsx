"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, Receipt, MessageCircle, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { label: "Resumen", href: "/app/asesor-pro/cliente", icon: LayoutDashboard },
  { label: "Facturas", href: "/app/asesor-pro/cliente/facturas", icon: FileText },
  { label: "Gastos", href: "/app/asesor-pro/cliente/gastos", icon: Receipt },
  { label: "Chat asesor", href: "/app/asesor-pro/cliente/chat", icon: MessageCircle },
];

interface Props {
  children: React.ReactNode;
  user: { id: string; email: string; full_name: string | null };
  context: { fiscal_name: string; nif: string };
}

export default function ClientShell({ children, user, context }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/products/auth/logout", { method: "POST" });
    router.push("/p/asesor-pro");
  }

  return (
    <div className="min-h-screen bg-paper flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-paper border-r-2 border-ink transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b-2 border-ink">
          <Link href="/app/asesor-pro/cliente" className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center bg-mustard-500">
              <span className="font-display text-ink text-lg" style={{ fontWeight: 500 }}>
                {context.fiscal_name.charAt(0)}
              </span>
            </div>
            <div className="leading-none min-w-0">
              <span className="font-display font-medium text-ink text-base block truncate">{context.fiscal_name}</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-mute mt-0.5 block">
                {context.nif}
              </span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-ink-mute">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app/asesor-pro/cliente" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-sans transition-all ${
                  isActive
                    ? "bg-ink text-paper font-medium"
                    : "text-ink-soft hover:text-ink hover:bg-sand-100"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-ink">
          <div className="mb-3 text-[11px] font-mono text-ink-mute truncate">
            {user.full_name ?? user.email}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-[12px] text-ink-mute hover:text-rose-alert transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-paper border-b-2 border-ink flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-ink-mute">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink-mute">
            AsesorPro · Tu panel
          </span>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
