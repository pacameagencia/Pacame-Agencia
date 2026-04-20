"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PlanCard, { type PlanCardData } from "./PlanCard";

interface Props {
  plans: PlanCardData[];
}

export default function PlansGrid({ plans }: Props) {
  const [interval, setInterval] = useState<"month" | "year">("month");

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => setInterval("month")}
            className={`px-5 py-2 rounded-full text-sm font-body font-medium transition ${
              interval === "month"
                ? "bg-olympus-gold text-pacame-black"
                : "text-pacame-white/60 hover:text-pacame-white"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`px-5 py-2 rounded-full text-sm font-body font-medium transition flex items-center gap-2 ${
              interval === "year"
                ? "bg-olympus-gold text-pacame-black"
                : "text-pacame-white/60 hover:text-pacame-white"
            }`}
          >
            Anual
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                interval === "year"
                  ? "bg-pacame-black/20 text-pacame-black"
                  : "bg-olympus-gold/20 text-olympus-gold"
              }`}
            >
              -17%
            </span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {plans.map((plan, idx) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            interval={interval}
            featured={idx === 2 || plan.is_featured}
          />
        ))}
      </motion.div>
    </div>
  );
}
