"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserPlus, FileText, Bot,
  DollarSign, Settings, ChevronLeft, Menu, X,
  MessageSquare, Bell, ClipboardCheck, CreditCard,
  Megaphone, FileCheck, Phone, Rocket, Building2, Award, LogOut,
  TrendingUp, MessageCircle, Lightbulb, Network, ShoppingBag, Package,
  BookOpen, Target, Brain, Heart, Wallet, Banknote, Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Oficina", href: "/dashboard/office", icon: Building2 },
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Clientes", href: "/dashboard/clients", icon: Users },
  { label: "Leads", href: "/dashboard/leads", icon: UserPlus },
  { label: "Lead Gen", href: "/dashboard/leadgen", icon: Rocket },
  { label: "Outreach", href: "/dashboard/outreach", icon: Target },
  { label: "Cerebro", href: "/dashboard/brain", icon: Brain },
  { label: "Growth Loop", href: "/dashboard/growth", icon: Heart },
  { label: "LLM Costs", href: "/dashboard/llm-costs", icon: Banknote },
  { label: "Marketplace", href: "/dashboard/catalog", icon: Package },
  { label: "Pedidos", href: "/dashboard/orders", icon: ShoppingBag },
  { label: "Contenido", href: "/dashboard/content", icon: FileText },
  { label: "Campanas", href: "/dashboard/campaigns", icon: Megaphone },
  { label: "Propuestas", href: "/dashboard/proposals", icon: FileCheck },
  { label: "Referidos", href: "/dashboard/referrals", icon: Award },
  { label: "Payouts", href: "/dashboard/payouts", icon: Wallet },
  { label: "Llamadas", href: "/dashboard/calls", icon: Phone },
  { label: "WhatsApp", href: "/dashboard/conversations", icon: MessageCircle },
  { label: "Comercial", href: "/dashboard/commercial", icon: TrendingUp },
  { label: "Agentes", href: "/dashboard/agents", icon: Bot },
  { label: "Red Neuronal", href: "/dashboard/neural", icon: Network },
  { label: "Descubrimientos", href: "/dashboard/discoveries", icon: Lightbulb },
  { label: "Onboarding", href: "/dashboard/onboarding", icon: ClipboardCheck },
  { label: "Pagos", href: "/dashboard/payments", icon: CreditCard },
  { label: "Finanzas", href: "/dashboard/finances", icon: DollarSign },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: Bell },
  { label: "API Docs", href: "/docs/api", icon: BookOpen },
  { label: "Env Registry", href: "/dashboard/env", icon: Shield },
  { label: "Config", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      setUnreadCount(count || 0);
    }
    fetchUnread();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel("layout-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        setUnreadCount((prev) => prev + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-paper-soft border-r border-ink/[0.06] transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-ink/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">P</span>
            </div>
            <span className="font-heading font-bold text-ink text-lg">PACAME</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-ink/50">
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
                    ? "bg-brand-primary/15 text-brand-primary font-medium"
                    : "text-ink/50 hover:text-ink/80 hover:bg-white/[0.04]"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
                {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold font-body px-1.5">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-ink/[0.06] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-ink/30 hover:text-ink/50 transition-colors font-body"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Volver a la web
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-ink/20 hover:text-red-400/70 transition-colors font-body"
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
        <header className="h-16 border-b border-ink/[0.06] flex items-center px-4 lg:px-8 gap-4 bg-paper-soft/50 backdrop-blur-sm sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-ink/50">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link
            href="/dashboard/notifications"
            className="relative p-2 rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            <Bell className="w-4.5 h-4.5 text-ink/40" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold font-body px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2 text-xs text-ink/40 font-body">
            <div className="w-2 h-2 rounded-full bg-mint animate-pulse" />
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
