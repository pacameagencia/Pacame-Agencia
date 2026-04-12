"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter",
          email,
          message: "Suscripcion al newsletter del blog",
          services: ["Newsletter"],
        }),
      });
    } catch {
      // Save attempted even on failure
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="flex items-center justify-center gap-2 text-lime-pulse font-body">
        <CheckCircle2 className="w-5 h-5" />
        <span>Te has suscrito correctamente</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@empresa.com"
        className="flex-1 h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet outline-none transition-colors"
      />
      <Button variant="gradient" size="default" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Suscribirse"}
      </Button>
    </form>
  );
}
