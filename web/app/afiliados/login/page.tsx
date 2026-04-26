"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginAfiliadoPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/referrals/public/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(translate(data.error));
      router.push("/afiliados/panel");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-heading text-3xl">Acceder al panel</h1>
      <p className="mt-2 text-sm text-ink/60">
        Tu panel de afiliado: enlace, estadísticas, comisiones y biblioteca.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-ink/80">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-ink/80">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="rounded-sm border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-sm bg-terracotta-500 px-4 py-3 font-medium text-paper hover:bg-terracotta-600 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Acceder"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/afiliados/registro" className="text-terracotta-500 hover:underline">
            Crear cuenta
          </Link>
          <span className="text-ink/40">·</span>
          <a
            href="mailto:hola@pacameagencia.com?subject=He%20olvidado%20mi%20contrase%C3%B1a%20de%20afiliado"
            className="text-ink/60 hover:text-ink"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>
    </main>
  );
}

function translate(code: string | undefined): string {
  switch (code) {
    case "missing_credentials": return "Introduce email y contraseña.";
    case "invalid_credentials": return "Email o contraseña incorrectos.";
    case "account_disabled": return "Tu cuenta está desactivada. Contacta con hola@pacameagencia.com.";
    default: return "No se ha podido iniciar sesión.";
  }
}
