"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/data/blog-posts";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";

const posts = blogPosts.slice(0, 3);

export default function BlogPreview() {
  return (
    <section className="section-padding bg-pacame-black relative">
      {/* Golden divider */}
      <div className="px-6">
        <GoldenDivider variant="line" />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-[13px] font-body font-medium text-olympus-gold/70 mb-4 uppercase tracking-[0.2em]">
                Blog
              </p>
              <h2 className="font-accent font-bold text-section text-ink text-balance">
                Conocimiento que{" "}
                <span className="gradient-text-gold">se convierte en negocio.</span>
              </h2>
            </div>
            <Button variant="outline" size="default" asChild className="flex-shrink-0 group rounded-full border-olympus-gold/20 hover:border-olympus-gold/40 hover:bg-olympus-gold/5">
              <Link href="/blog">
                Ver todos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {/* Featured layout: 1 large + 2 stacked */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5" staggerDelay={0.1}>
          {posts.map((post, i) => (
            <StaggerItem key={post.slug} className={i === 0 ? "md:col-span-2 md:row-span-2" : ""}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl card-apple overflow-hidden h-full relative"
              >
                {/* Gradient mesh header — procedural color */}
                <div
                  className={`relative overflow-hidden ${i === 0 ? "h-48" : "h-28"}`}
                  style={{
                    background: `linear-gradient(135deg, ${post.color}20 0%, ${post.color}08 40%, rgba(212,168,83,0.05) 100%)`,
                  }}
                >
                  {/* Decorative circles */}
                  <div
                    className="absolute top-4 right-8 w-24 h-24 rounded-full opacity-20 blur-xl"
                    style={{ backgroundColor: post.color }}
                  />
                  <div
                    className="absolute bottom-2 left-12 w-16 h-16 rounded-full opacity-10 blur-lg"
                    style={{ backgroundColor: "#E8B730" }}
                  />
                  {/* Category pill overlay */}
                  <div className="absolute bottom-3 left-4">
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-body font-medium backdrop-blur-sm"
                      style={{
                        backgroundColor: `${post.color}25`,
                        color: post.color,
                      }}
                    >
                      {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-7">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-ink/60 font-body">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className={`font-heading font-bold text-ink mb-3 leading-snug group-hover:text-olympus-gold transition-colors duration-300 ${i === 0 ? "text-xl" : "text-lg"}`}>
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className={`text-sm text-ink/65 font-body leading-relaxed mb-6 ${i === 0 ? "line-clamp-4" : "line-clamp-2"}`}>
                    {post.excerpt}
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-ink/60 font-body">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-heading border border-white/10"
                        style={{ backgroundColor: `${post.color}15`, color: post.color }}
                      >
                        {post.agentName[0]}
                      </span>
                      por {post.agentName}
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-ink/10 group-hover:text-olympus-gold group-hover:translate-x-1 transition-all duration-300"
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
