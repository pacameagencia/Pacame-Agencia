"use client";

import { Star } from "lucide-react";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import type { Testimonial } from "@/lib/data/testimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}

export default function TestimonialCard({
  testimonial,
  className = "",
}: TestimonialCardProps) {
  return (
    <CardTilt className={className} tiltMaxAngle={8}>
      <CardTiltContent className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 hover:border-olympus-gold/20 transition-colors h-full flex flex-col">
        {/* Star rating */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < testimonial.rating
                  ? "fill-olympus-gold text-olympus-gold"
                  : "fill-transparent text-white/20"
              }`}
            />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-pacame-white/80 font-body text-sm leading-relaxed italic flex-1">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-violet to-olympus-gold flex items-center justify-center text-white font-heading font-bold text-sm flex-shrink-0">
              {testimonial.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-pacame-white font-heading font-semibold text-sm">
                {testimonial.name}
              </p>
              <p className="text-pacame-white/50 font-body text-xs">
                {testimonial.role}, {testimonial.company}
              </p>
            </div>
          </div>
        </div>
      </CardTiltContent>
    </CardTilt>
  );
}
