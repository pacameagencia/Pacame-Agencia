"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/data/blog-posts";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";

const posts = blogPosts.slice(0, 3);

export default function BlogPreview() {
  return (
    <section className="section-padding bg-pacame-black relative">
      <div className="absolute top-0 inset-x-0 section-divider" />

      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-14">
            <div>
              <p className="text-[13px] font-body font-medium text-electric-violet mb-4 uppercase tracking-[0.2em]">
                Blog
              </p>
              <h2 className="font-heading font-bold text-section text-pacame-white text-balance">
                Conocimiento que{" "}
                <span className="gradient-text-vivid">se convierte en negocio.</span>
              </h2>
            </div>
            <Button variant="outline" size="default" asChild className="flex-shrink-0 group rounded-full border-white/[0.08] hover:border-white/20">
              <Link href="/blog">
                Ver todos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5" staggerDelay={0.1}>
          {posts.map((post) => (
            <StaggerItem key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl card-apple overflow-hidden h-full"
              >
                <div className="p-7">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-body font-medium"
                      style={{
                        backgroundColor: `${post.color}10`,
                        color: post.color,
                      }}
                    >
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-pacame-white/30 font-body">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-bold text-lg text-pacame-white mb-3 leading-snug group-hover:text-electric-violet transition-colors duration-300">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-pacame-white/40 font-body leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-pacame-white/30 font-body">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-heading"
                        style={{ backgroundColor: `${post.color}12`, color: post.color }}
                      >
                        {post.agentName[0]}
                      </span>
                      por {post.agentName}
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-pacame-white/10 group-hover:text-electric-violet group-hover:translate-x-1 transition-all duration-300"
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
