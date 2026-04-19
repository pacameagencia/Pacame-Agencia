"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CountUpNumber from "@/components/effects/CountUpNumber";

interface PublicStats {
  total_orders_delivered: number;
  total_clients_active: number;
  avg_delivery_hours?: number | null;
  avg_rating: number;
  uptime_pct: number;
}

export default function StatsFatBar() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setStats(d))
      .catch(() => null);
  }, []);

  const orders = stats?.total_orders_delivered ?? 420;
  const clients = stats?.total_clients_active ?? 500;
  const rating = stats?.avg_rating ?? 4.9;
  const uptime = stats?.uptime_pct ?? 99.9;

  return (
    <section className="relative bg-[linear-gradient(90deg,#0A0A0A_0%,#0D0B21_50%,#0A0A0A_100%)] py-16 sm:py-20 overflow-hidden">
      {/* Top border glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/40 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/40 to-transparent" />

      {/* Subtle radial olympus */}
      <div className="absolute inset-0 bg-olympus-radial opacity-40 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4"
          initial={reduced ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8 }}
        >
          {[
            {
              value: orders,
              suffix: "+",
              label: "Entregables firmados",
              decimals: false,
            },
            {
              value: clients,
              suffix: "+",
              label: "PYMEs confian en PACAME",
              decimals: false,
            },
            {
              value: rating,
              suffix: "/5",
              label: "Rating medio verificado",
              decimals: true,
            },
            {
              value: uptime,
              suffix: "%",
              label: "Uptime plataforma",
              decimals: true,
            },
          ].map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="font-heading font-bold text-4xl sm:text-5xl text-pacame-white mb-1.5 tabular-nums">
                {stat.decimals ? (
                  <>
                    <span>{stat.value}</span>
                    <span className="text-olympus-gold">{stat.suffix}</span>
                  </>
                ) : (
                  <CountUpNumber
                    target={stat.value}
                    suffix={stat.suffix}
                    duration={2.2}
                  />
                )}
              </div>
              <div className="text-xs sm:text-sm text-pacame-white/50 font-body uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
