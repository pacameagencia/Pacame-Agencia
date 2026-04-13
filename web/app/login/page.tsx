"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });

      if (!res.ok) {
        setError("Password incorrecto");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  }

  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-electric-violet/[0.05] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">PACAME Dashboard</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">Acceso restringido</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl glass p-6 space-y-4">
          <div>
            <label className="block text-xs text-pacame-white/50 font-body mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pacame-white/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introduce el password"
                required
                autoFocus
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-dark-card border border-white/[0.06] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet focus:ring-1 focus:ring-electric-violet outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-body">{error}</p>
          )}

          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full group"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-[10px] text-pacame-white/20 font-body mt-6">
          Solo Pablo tiene acceso a este panel.
        </p>
      </div>
    </div>
  );
}
