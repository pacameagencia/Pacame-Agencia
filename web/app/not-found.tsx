"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Home, Search } from "lucide-react";
import { motion } from "framer-motion";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Button } from "@/components/ui/button";
import MagneticButton from "@/components/effects/MagneticButton";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { FancyText } from "@/components/ui/fancy-text";
import ScrollReveal from "@/components/ui/scroll-reveal";

const ConstellationBackground = dynamic(
  () => import("@/components/effects/ConstellationBackground"),
  { ssr: false }
);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  },
};

export default function NotFound() {
  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Constellation background */}
      <ConstellationBackground density={30} />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-olympus-radial pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-lg mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 404 number */}
        <motion.div variants={itemVariants} className="mb-4">
          <FancyText
            className="font-heading font-bold text-[8rem] leading-none text-white/5"
            fillClassName="gradient-text-gold"
            stagger={0.1}
            duration={1.5}
          >
            404
          </FancyText>
        </motion.div>

        <motion.div variants={itemVariants}>
          <GoldenDivider variant="star" />
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="font-heading font-bold text-2xl text-pacame-white mb-4 mt-6"
        >
          Pagina no encontrada
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-pacame-white/50 font-body mb-10 max-w-sm mx-auto"
        >
          La pagina que buscas no existe o ha sido movida.
          Vuelve al inicio o explora nuestros servicios.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <MagneticButton>
            <ShinyButton
              gradientFrom="#D4A853"
              gradientTo="#7C3AED"
              gradientOpacity={0.8}
              className="group min-w-[200px] h-12 px-6 text-sm font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <Link href="/" className="flex items-center gap-2 text-pacame-white">
                <Home className="w-4 h-4" />
                Volver al inicio
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ShinyButton>
          </MagneticButton>
          <Button variant="outline" size="lg" asChild className="rounded-full border-olympus-gold/20 hover:border-olympus-gold/40 hover:bg-olympus-gold/5">
            <Link href="/servicios">
              <Search className="w-4 h-4" />
              Ver servicios
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
