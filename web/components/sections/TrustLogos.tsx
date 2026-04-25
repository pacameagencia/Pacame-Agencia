"use client";

import { motion, useReducedMotion } from "framer-motion";

// Tech stack and platform logos as minimal SVG outlines — represents the tools and platforms we work with
const logos = [
  {
    name: "Google",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <path d="M12 11v4h6.5c-.3 1.5-1.1 2.7-2.3 3.5l3.7 2.8c2.1-2 3.4-4.8 3.4-8.2 0-.8-.1-1.5-.2-2.2H12z" strokeLinejoin="round" />
        <path d="M5.5 14.3l-3.7 2.8C3.6 20.6 7.5 23 12 23c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.8c-1.1.7-2.5 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.2z" strokeLinejoin="round" />
        <path d="M1.8 7C.7 8.5 0 10.2 0 12c0 1.8.7 3.5 1.8 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Stripe",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M12 8c-2 0-3.5.7-3.5 2.2 0 2.8 5 1.8 5 4.2 0 1.5-1.8 2.1-3.5 2.1-1.5 0-3-.5-3-.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <path d="M12 3L2 20h20L12 3z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Meta",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <path d="M12 12c2.5-4 5-6 7-6 2.5 0 4 2.5 4 6s-1.5 6-4 6c-2 0-4.5-2-7-6z" strokeLinejoin="round" />
        <path d="M12 12c-2.5-4-5-6-7-6-2.5 0-4 2.5-4 6s1.5 6 4 6c2 0 4.5-2 7-6z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Supabase",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <path d="M13.5 21.5c-.4.6-1.4.2-1.4-.5V13h8.3c1.2 0 1.8 1.3 1 2.2L13.5 21.5z" strokeLinejoin="round" />
        <path d="M10.5 2.5c.4-.6 1.4-.2 1.4.5V11H3.6c-1.2 0-1.8-1.3-1-2.2L10.5 2.5z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Claude",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 9v6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Next.js",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 8v8" strokeLinecap="round" />
        <path d="M8 8l9 12" strokeLinecap="round" />
        <path d="M16 8v5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "TailwindCSS",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-7 h-7">
        <path d="M7 10c1-3 3-4.5 6-4.5 4.5 0 5 3 7.5 3.5 1.7.3 3-.3 4-1.5-1 3-3 4.5-6 4.5-4.5 0-5-3-7.5-3.5-1.7-.3-3 .3-4 1.5z" strokeLinejoin="round" />
        <path d="M3 16.5c1-3 3-4.5 6-4.5 4.5 0 5 3 7.5 3.5 1.7.3 3-.3 4-1.5-1 3-3 4.5-6 4.5-4.5 0-5-3-7.5-3.5-1.7-.3-3 .3-4 1.5z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function TrustLogos() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <motion.p
          className="text-center text-[13px] font-body font-medium text-pacame-white/25 uppercase tracking-[0.2em] mb-12"
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Tecnologias y plataformas que utilizamos
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-14">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              className="flex flex-col items-center gap-2 text-pacame-white/15 hover:text-pacame-white/40 transition-colors duration-500 group cursor-default"
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <div className="group-hover:scale-110 transition-transform duration-500">
                {logo.svg}
              </div>
              <span className="text-[10px] font-body tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {logo.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-olympus-gold/10 to-transparent" />
    </section>
  );
}
