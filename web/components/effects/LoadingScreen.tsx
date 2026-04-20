"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem("pacame_loaded")) {
      setShow(false);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerating progress curve
        const increment = prev < 60 ? 4 : prev < 85 ? 6 : 8;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("pacame_loaded", "1");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050507]"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Background ambient glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-primary/[0.04] blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-accent-gold/[0.03] blur-[100px]" />
          </div>

          {/* Logo animation */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* SVG Logo with draw-on effect */}
            <motion.svg
              width="64"
              height="64"
              viewBox="0 0 28 28"
              fill="none"
              className="mb-8"
            >
              <defs>
                <linearGradient id="loading-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="50%" stopColor="#D4A853" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <motion.rect
                width="28"
                height="28"
                rx="7"
                fill="url(#loading-logo-grad)"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              />
              <motion.path
                d="M9 21V7H14.5C17 7 19 9 19 11.5C19 14 17 16 14.5 16H12.5"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
              />
              <motion.circle
                cx="20" cy="8" r="1" fill="white"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.0 }}
              />
              <motion.circle
                cx="22" cy="12" r="0.7" fill="white"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.15 }}
              />
            </motion.svg>

            {/* Brand name */}
            <motion.span
              className="font-heading font-bold text-xl text-ink tracking-[0.15em] mb-10"
              initial={{ opacity: 0, letterSpacing: "0.3em" }}
              animate={{ opacity: 1, letterSpacing: "0.15em" }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              PACAME
            </motion.span>

            {/* Progress bar */}
            <div className="w-48 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #7C3AED, #D4A853, #06B6D4)",
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
