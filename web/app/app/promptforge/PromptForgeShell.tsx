"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wand2, History, Bookmark, LayoutTemplate, LogOut, Menu, X, Clock } from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";

const NAV = [
  { label: "Forge", href: "/app/promptforge", icon: Wand2 },
  { label: "Plantillas", href: "/app/promptforge/templates", icon: LayoutTemplate },
  { label: "Historial", href: "/app/promptforge/history", icon: History },
  { label: "Favoritos", href: "/app/promptforge/starred", icon: Bookmark },
];

export default function PromptForgeShell({
  children,
  user,
  subscription,
  trialDaysLeft,
}: {
  children: React.ReactNode;
  user: { id: string; email: string; full_name: string | null };
  subscription: { tier: string; status: string; trial_ends_at: string | null };
  trialDaysLeft: number | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/products/auth/logout", { method: "POST" });
    router.push("/p/promptforge");
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-paper flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-paper border-r-2 border-ink transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b-2 border-ink">
          <Link href="/app/promptforge" className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center" style={{ background: "#283B70" }}>
              <Wand2 className="w-5 h-5 text-paper" />
            </div>
            <div className="leading-none">
              <span className="font-display font-medium text-ink text-base block">PromptForge</span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-mute mt-0.5 block">· PACAME</span>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-ink-mute">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/app/promptforge" && pathname.startsWith(item.href));
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
          <div className="mb-2 text-[11px] font-mono text-ink-mute truncate">
            {user.full_name ?? user.email}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-mustard-700 mb-2">
            Plan {subscription.tier}
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-[12px] text-ink-mute hover:text-rose-alert">
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-paper border-b-2 border-ink flex items-center px-4 lg:px-8 gap-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden text-ink-mute">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {trialDaysLeft !== null && trialDaysLeft >= 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-mustard-500/15 border border-mustard-500/30 text-ink">
              <Clock className="w-3.5 h-3.5 text-mustard-700" />
              <span className="font-mono text-[11px] tracking-[0.15em] uppercase">
                Trial · {trialDaysLeft}d
              </span>
              <Link href="/app/promptforge/plan" className="ml-2 font-mono text-[11px] tracking-[0.15em] uppercase text-terracotta-500 hover:text-terracotta-600">
                Activar →
              </Link>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
