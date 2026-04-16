"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  FileUp,
  MessageSquare,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface PortalSidebarProps {
  clientName: string;
  logoUrl: string | null;
  primaryColor: string;
  unreadCount: number;
}

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Proyectos", href: "/portal/projects", icon: FolderKanban },
  { label: "Archivos", href: "/portal/files", icon: FileUp },
  { label: "Mensajes", href: "/portal/messages", icon: MessageSquare, badge: true },
  { label: "Pagos", href: "/portal/payments", icon: Receipt },
  { label: "Ajustes", href: "/portal/settings", icon: Settings },
];

export default function PortalSidebar({
  clientName,
  logoUrl,
  primaryColor,
  unreadCount,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    document.cookie = "pacame_client_auth=; path=/; max-age=0";
    router.push("/portal");
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clientName}
              className="w-10 h-10 rounded-xl object-cover border border-white/[0.08]"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-white text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              P
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading font-semibold text-pacame-white text-sm truncate">
              {clientName}
            </p>
            <p className="text-[11px] text-pacame-white/40 font-body">Portal de cliente</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-200 group"
              style={
                active
                  ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                  : undefined
              }
            >
              {active && (
                <motion.div
                  layoutId="portal-nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                className="w-[18px] h-[18px] flex-shrink-0 transition-colors"
                style={active ? { color: primaryColor } : undefined}
              />
              <span
                className={
                  active
                    ? "font-medium"
                    : "text-pacame-white/60 group-hover:text-pacame-white transition-colors"
                }
              >
                {item.label}
              </span>
              {item.badge && unreadCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold text-white min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="p-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-body text-pacame-white/40 hover:text-rose-alert hover:bg-rose-alert/10 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Cerrar sesion
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#111112] border-r border-white/[0.06]">
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#111112]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-pacame-white/60 hover:text-pacame-white hover:bg-white/[0.06] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-heading font-bold text-white text-xs"
              style={{ backgroundColor: primaryColor }}
            >
              P
            </div>
          )}
          <span className="font-heading font-semibold text-pacame-white text-sm">
            {clientName}
          </span>
        </div>
      </div>

      {/* Mobile slide-in */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#111112] border-r border-white/[0.06] lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-pacame-white/40 hover:text-pacame-white hover:bg-white/[0.06] transition-colors"
                aria-label="Cerrar menu"
              >
                <X className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
