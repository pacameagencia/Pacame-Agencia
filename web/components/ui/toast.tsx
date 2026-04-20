"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  info: { icon: Info, color: "text-brand-primary", bg: "bg-brand-primary/10 border-brand-primary/30" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = t.duration ?? 4500;
      const newToast: Toast = { ...t, id, duration };
      setToasts((prev) => [...prev, newToast]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach((v) => clearTimeout(v));
      t.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const { icon: Icon, color, bg } = VARIANT_STYLES[t.variant];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`pointer-events-auto rounded-xl backdrop-blur-md border ${bg} p-4 shadow-2xl`}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-heading font-semibold text-ink">{t.title}</div>
                    {t.description && (
                      <div className="text-xs text-ink/70 font-body mt-1 leading-relaxed">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="text-ink/40 hover:text-ink/80 transition-colors"
                    aria-label="Cerrar notificación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>");
  }
  return ctx;
}
