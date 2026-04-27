"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/data/blog-posts";

interface Category {
  name: string;
  slug: string;
  color: string;
}

const categories: Category[] = [
  { name: "Todos", slug: "todos", color: "#B54E30" },
  { name: "Desarrollo Web", slug: "web", color: "#283B70" },
  { name: "SEO", slug: "seo", color: "#2563EB" },
  { name: "Paid Media", slug: "ads", color: "#EA580C" },
  { name: "Redes Sociales", slug: "social", color: "#EC4899" },
  { name: "Estrategia", slug: "estrategia", color: "#D97706" },
  { name: "Branding", slug: "branding", color: "#B54E30" },
];

const categorySlugMap: Record<string, string> = {
  "Desarrollo Web": "web",
  SEO: "seo",
  "Paid Media": "ads",
  "Redes Sociales": "social",
  Estrategia: "estrategia",
  Branding: "branding",
};

function PostCard({
  post,
  featured,
}: {
  post: BlogPost;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl bg-paper-deep border border-ink/[0.06] hover:border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-1"
    >
      <div
        className={featured ? "h-1.5 w-full" : "h-1 w-full"}
        style={{
          background: `linear-gradient(90deg, ${post.color}, transparent)`,
        }}
      />
      <div className={featured ? "p-8" : "p-6"}>
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs px-3 py-1 rounded-full font-body font-medium"
            style={{
              backgroundColor: `${post.color}20`,
              color: post.color,
              border: `1px solid ${post.color}30`,
            }}
          >
            {post.category}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-ink/40 font-body">
            <Clock className="w-3 h-3" />
            {post.readTime}
          </div>
          {featured && (
            <span className="text-xs text-ink/30 font-body">
              {post.date}
            </span>
          )}
        </div>

        <h3
          className={`font-heading font-bold text-ink leading-snug group-hover:text-brand-primary transition-colors ${featured ? "text-2xl mb-3" : "text-lg mb-3"}`}
        >
          {post.title}
        </h3>

        <p
          className={`text-sm text-ink/60 font-body leading-relaxed ${featured ? "mb-6" : "mb-5 line-clamp-3"}`}
        >
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-ink/40 font-body">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-heading"
              style={{
                backgroundColor: `${post.color}30`,
                color: post.color,
              }}
            >
              {post.agentName[0]}
            </span>
            {featured ? `por ${post.agentName}` : `${post.agentName} · ${post.date}`}
          </div>
          <ArrowRight className="w-4 h-4 text-ink/30 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}

export default function BlogFilteredList({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState("todos");

  const filtered =
    activeCategory === "todos"
      ? posts
      : posts.filter(
          (p) => categorySlugMap[p.category] === activeCategory,
        );

  const featuredPosts = filtered.filter((p) => p.featured);
  const regularPosts = filtered.filter((p) => !p.featured);

  return (
    <>
      {/* Category filters */}
      <section className="pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat.slug)}
                  className="px-4 py-2 rounded-full text-sm font-body border transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: isActive ? `${cat.color}60` : `${cat.color}20`,
                    color: isActive ? cat.color : `${cat.color}70`,
                    backgroundColor: isActive ? `${cat.color}15` : "transparent",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="section-padding relative">
        <div className="absolute top-0 inset-x-0 section-divider" />
        <div className="max-w-6xl mx-auto px-6">
          {filtered.length === 0 && (
            <p className="text-center text-ink/40 font-body py-16">
              No hay articulos en esta categoria todavia.
            </p>
          )}

          {/* Featured */}
          {featuredPosts.length > 0 && (
            <div
              className={`grid grid-cols-1 ${featuredPosts.length > 1 ? "md:grid-cols-2" : ""} gap-6 ${regularPosts.length > 0 ? "mb-16" : ""}`}
            >
              {featuredPosts.map((post) => (
                <PostCard key={post.slug} post={post} featured />
              ))}
            </div>
          )}

          {/* Regular */}
          {regularPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
