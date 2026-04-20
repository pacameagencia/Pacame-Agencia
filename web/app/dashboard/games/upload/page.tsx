"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Check, AlertCircle } from "lucide-react";

export default function GamesUploadPage() {
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    engine: "unity",
    aspect_ratio: "16:9",
    is_featured: false,
  });
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ id: string; slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `status ${res.status}`);
      setResult(json.game);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/dashboard/games"
        className="inline-flex items-center gap-2 text-ink/60 hover:text-ink text-sm font-body transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a games
      </Link>

      <div>
        <h1 className="font-heading font-bold text-2xl text-ink flex items-center gap-2">
          <Upload className="w-6 h-6 text-accent-gold" /> Subir nuevo game
        </h1>
        <p className="text-sm text-ink/40 font-body mt-1">
          Paso 1: crear entrada en el catalogo. Paso 2: subir los 4 archivos del build
          Unity WebGL y marcar como activo.
        </p>
      </div>

      {!result ? (
        <form
          onSubmit={create}
          className="p-6 rounded-2xl bg-paper-deep border border-ink/[0.06] space-y-5"
        >
          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/50 font-mono mb-2">
              Slug (URL friendly, ej: my-game)
            </label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) =>
                setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
              }
              placeholder="pacame-experience"
              className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink font-mono text-sm outline-none focus:border-accent-gold/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/50 font-mono mb-2">
              Titulo
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="PACAME Experience"
              className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink outline-none focus:border-accent-gold/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-ink/50 font-mono mb-2">
              Descripcion
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Descripcion corta (se muestra en el catalogo y metadata OG)"
              className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink text-sm outline-none focus:border-accent-gold/40 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/50 font-mono mb-2">
                Engine
              </label>
              <select
                value={form.engine}
                onChange={(e) => setForm({ ...form, engine: e.target.value })}
                className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink outline-none focus:border-accent-gold/40 transition"
              >
                <option value="unity">Unity WebGL</option>
                <option value="threejs">Three.js</option>
                <option value="phaser">Phaser 3</option>
                <option value="html5">HTML5 Canvas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/50 font-mono mb-2">
                Aspect ratio
              </label>
              <select
                value={form.aspect_ratio}
                onChange={(e) => setForm({ ...form, aspect_ratio: e.target.value })}
                className="w-full bg-white/[0.02] border border-ink/[0.08] rounded-xl px-4 py-3 text-ink outline-none focus:border-accent-gold/40 transition"
              >
                <option value="16:9">16:9 (landscape)</option>
                <option value="21:9">21:9 (cinematic)</option>
                <option value="4:3">4:3 (classic)</option>
                <option value="1:1">1:1 (square)</option>
                <option value="9:16">9:16 (portrait/mobile)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/50 font-mono mb-2">
                Destacado
              </label>
              <label className="inline-flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                <span className="text-sm text-ink/70">Mostrar como hero en /games</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-gold text-ink font-semibold text-sm disabled:opacity-50 hover:brightness-110 transition"
          >
            {creating ? "Creando..." : "Crear entrada catalogo"}
          </button>
        </form>
      ) : (
        <div className="p-6 rounded-2xl bg-mint/5 border border-mint/30">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-mint" />
            <span className="font-heading font-semibold text-ink">
              Entrada creada: {result.slug}
            </span>
          </div>
          <p className="text-sm text-ink/70 mb-4 leading-relaxed">
            Siguiente paso: sube los 4 archivos del build Unity WebGL a{" "}
            <strong>Supabase Storage</strong> en el bucket{" "}
            <code className="font-mono text-accent-gold">unity-games/{result.slug}/</code>:
          </p>
          <ul className="text-xs font-mono text-ink/80 space-y-1 bg-paper p-4 rounded-lg mb-4">
            <li>• <strong>{result.slug}</strong>.loader.js</li>
            <li>• <strong>{result.slug}</strong>.data (o .data.gz si gzip)</li>
            <li>• <strong>{result.slug}</strong>.framework.js</li>
            <li>• <strong>{result.slug}</strong>.wasm</li>
          </ul>
          <p className="text-sm text-ink/70 leading-relaxed">
            Despues vuelve aqui y edita el game para rellenar las URLs de cada archivo y
            marcarlo como activo. Guia completa en{" "}
            <Link
              href="/docs/games-integration"
              className="text-brand-primary underline"
            >
              docs/games-integration
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
