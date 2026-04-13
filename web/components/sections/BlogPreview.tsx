"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const posts = [
  {
    title: "7 errores que cometen las PYMEs con su web y como evitarlos",
    excerpt: "El 78% de las pymes espanolas no tiene presencia digital profesional. Tu negocio esta cayendo en alguno de estos errores?",
    category: "Desarrollo Web",
    readTime: "5 min",
    color: "#06B6D4",
    agentName: "Pixel",
    slug: "7-errores-pymes-web",
  },
  {
    title: "Como pasar de 0 a 1.000 visitas organicas en 90 dias",
    excerpt: "El plan de SEO concreto que usamos con nuestros clientes. Fases, herramientas y metricas reales.",
    category: "SEO",
    readTime: "8 min",
    color: "#2563EB",
    agentName: "Atlas",
    slug: "0-a-1000-visitas-90-dias",
  },
  {
    title: "Meta Ads en 2026: la guia definitiva para PYMEs",
    excerpt: "Todo lo que necesitas saber para lanzar campanas que generen ROI real. Sin humo, con datos.",
    category: "Paid Media",
    readTime: "10 min",
    color: "#EA580C",
    agentName: "Nexus",
    slug: "meta-ads-guia-pymes-2026",
  },
];

export default function BlogPreview() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
            <div>
              <p className="font-mono text-electric-violet text-sm mb-3 uppercase tracking-widest">
                Blog
              </p>
              <h2 className="font-heading font-bold text-section text-pacame-white">
                Conocimiento que{" "}
                <span className="gradient-text-vivid">se convierte en negocio.</span>
              </h2>
            </div>
            <Button variant="outline" size="default" asChild className="flex-shrink-0 group border-white/10 hover:border-electric-violet/40">
              <Link href="/blog">
                Ver todos los articulos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.1}>
          {posts.map((post) => (
            <StaggerItem key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl card-interactive card-shine overflow-hidden h-full"
              >
                {/* Color accent - more visible */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(90deg, ${post.color}, ${post.color}40, transparent)` }}
                />

                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-body font-medium"
                      style={{
                        backgroundColor: `${post.color}20`,
                        color: post.color,
                        border: `1px solid ${post.color}30`,
                      }}
                    >
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-pacame-white/40 font-body">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-bold text-lg text-pacame-white mb-3 leading-snug group-hover:text-electric-violet transition-colors duration-300">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-pacame-white/60 font-body leading-relaxed mb-5 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-pacame-white/40 font-body">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-heading"
                        style={{ backgroundColor: `${post.color}30`, color: post.color }}
                      >
                        {post.agentName[0]}
                      </span>
                      por {post.agentName}
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-pacame-white/20 group-hover:text-electric-violet group-hover:translate-x-1 transition-all duration-300"
                    />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
