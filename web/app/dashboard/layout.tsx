"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserPlus, FileText, Bot,
  DollarSign, Settings, ChevronLeft, Menu, X,
  MessageSquare, Bell, ClipboardCheck, CreditCard,
  Megaphone, FileCheck, Phone, Rocket, Building2, Award, LogOut,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Oficina", href: "/dashboard/office", icon: Building2 },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Clientes", href: "/dashboard/clients", icon: Users },
  { label: "Leads", href: "/dashboard/leads", icon: UserPlus },
  { label: "Lead Gen", href: "/dashboard/leadgen", icon: Rocket },
  { label: "Contenido", href: "/dashboard/content", icon: FileText },
  { label: "Campanas", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Propuestas", href: "/dashboard/proposals", icon: FileCheck },
  { label: "Referidos", href: "/dashboard/referrals", icon: Award },
  { label: "Llamadas", href: "/dashboard/calls", icon: Phone },
  { label: "Agentes", href: "/dashboard/agents", icon: Bot },
  { label: "Onboarding", href: "/dashboard/onboarding", icon: ClipboardCheck },
  { label: "Pagos", href: "/dashboard/payments", icon: CreditCard },
  { label: "Finanzas", href: "/dashboard/finances", icon: DollarSign },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: Bell },
  { label: "Config", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-pacame-black flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-elevated border-r border-white/[0.06] transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">P</span>
            </div>
            <span className="font-heading font-bold text-pacame-white text-lg">PACAME</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-pacame-white/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all ${
                  isActive
                    ? "bg-electric-violet/15 text-electric-violet font-medium"
                    : "text-pacame-white/50 hover:text-pacame-white/80 hover:bg-white/[0.04]"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.06] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-pacame-white/30 hover:text-pacame-white/50 transition-colors font-body"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Volver a la web
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-pacame-white/20 hover:text-red-400/70 transition-colors font-body"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-white/[0.06] flex items-center px-4 lg:px-8 gap-4 bg-dark-elevated/50 backdrop-blur-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-pacame-white/50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-pacame-white/40 font-body">
            <div className="w-2 h-2 rounded-full bg-lime-pulse animate-pulse" />
            Sistema operativo
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
