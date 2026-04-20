"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Home, Search, Compass, Mail, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Button } from "@/components/ui/button";
import MagneticButton from "@/components/effects/MagneticButton";
import GoldenDivider from "@/components/effects/GoldenDivider";
import { FancyText } from "@/components/ui/fancy-text";

const ConstellationBackground = dynamic(
  () => import("@/components/effects/ConstellationBackground"),
  { ssr: false }
);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
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

interface Suggestion {
  href: string;
  label: string;
  description: string;
  Icon: typeof Home;
}

const suggestions: Suggestion[] = [
  {
    href: "/",
    label: "Ir al inicio",
    description: "Empieza por la home",
    Icon: Home,
  },
  {
    href: "/servicios",
    label: "Ver servicios",
    description: "Todo lo que hacemos",
    Icon: Compass,
  },
  {
    href: "/casos",
    label: "Casos de exito",
    description: "Resultados reales",
    Icon: BookOpen,
  },
  {
    href: "/blog",
    label: "Leer el blog",
    description: "Ideas para tu negocio",
    Icon: BookOpen,
  },
  {
    href: "/contacto",
    label: "Contacto",
    description: "Escribenos directamente",
    Icon: Mail,
  },
];

export default function NotFound() {
  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center relative overflow-hidden py-20">
      {/* Constellation background */}
      <ConstellationBackground density={30} />

      {/* Ambient glow dorado */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-olympus-radial pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-electric-violet/[0.06] rounded-full blur-[180px] pointer-events-none" />

      <motion.div
        className="relative z-10 max-w-2xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 404 number gigante */}
        <motion.div variants={itemVariants} className="mb-2">
          <FancyText
            className="font-heading font-bold text-[10rem] md:text-[14rem] leading-none text-white/5"
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
          className="font-heading font-bold text-3xl md:text-4xl text-pacame-white mb-4 mt-8 text-balance"
        >
          Esta pagina se fue a tomar un cafe.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg text-pacame-white/60 font-body mb-10 max-w-md mx-auto leading-relaxed"
        >
          O nunca existio, o cambiamos la direccion, o alguien la borro por error.
          Te ayudamos a encontrar lo que buscas.
        </motion.p>

        {/* Sugerencias rapidas — las 3 primeras destacadas como cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10"
        >
          {suggestions.slice(0, 3).map(({ href, label, description, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl bg-dark-card/70 backdrop-blur-sm border border-white/[0.06] p-5 text-left hover:border-olympus-gold/30 transition-all hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-lg bg-olympus-gold/10 border border-olympus-gold/20 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-olympus-gold" />
              </div>
              <p className="font-heading font-semibold text-sm text-pacame-white group-hover:text-olympus-gold transition-colors mb-1">
                {label}
              </p>
              <p className="text-xs text-pacame-white/50 font-body">
                {description}
              </p>
            </Link>
          ))}
        </motion.div>

        {/* Links secundarios en una linea */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-body text-pacame-white/40 mb-10"
        >
          {suggestions.slice(3).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hover:text-olympus-gold transition-colors underline underline-offset-4 decoration-white/[0.08] hover:decoration-olympus-gold/60"
            >
              {label}
            </Link>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <MagneticButton>
            <ShinyButton
              gradientFrom="#D4A853"
              gradientTo="#7C3AED"
              gradientOpacity={0.8}
              className="group min-w-[220px] h-12 px-6 text-sm font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <Link href="/" className="flex items-center gap-2 text-pacame-white">
                <Home className="w-4 h-4" />
                Volver al inicio
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ShinyButton>
          </MagneticButton>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="rounded-full border-olympus-gold/20 hover:border-olympus-gold/40 hover:bg-olympus-gold/5"
          >
            <Link href="/contacto">
              <Search className="w-4 h-4" />
              No encuentro lo que busco
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
