"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, AlertCircle } from "lucide-react";

interface Product {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price_cents: number;
  agent_id: string;
  delivery_sla_hours: number;
  deliverable_kind: string;
  revisions_included: number;
  inputs_schema: Record<string, unknown>;
  features: string[];
  faq: { q: string; a: string }[];
  category: string;
  tags: string[];
  runner_type: string;
  runner_config: Record<string, unknown>;
  product_type: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const AGENTS = ["nova", "pixel", "copy", "atlas", "pulse", "sage", "core", "nexus", "lens"];
const CATEGORIES = ["branding", "web", "copy", "seo", "social", "ads", "analytics", "apps", "templates"];
const RUNNER_TYPES = [
  { value: "llm_text", label: "LLM Text — texto generado por IA" },
  { value: "llm_structured", label: "LLM Structured — JSON + imagen opcional" },
  { value: "llm_image", label: "LLM Image — una imagen generada" },
  { value: "llm_image_multi", label: "LLM Image Multi — N variantes (logos)" },
  { value: "html_zip_render", label: "HTML ZIP — landing page completa" },
  { value: "pdf_render", label: "PDF Render — informe PDF (Sprint 3 Fase B)" },
  { value: "custom", label: "Custom — codigo TypeScript a medida" },
];
const DELIVERABLE_KINDS = ["image", "pdf", "html_zip", "text", "social_post", "logo_pack", "favicon_pack"];
const PRODUCT_TYPES = ["one_off", "subscription", "bundle", "app", "template", "tiered"];

const defaultProduct: Product = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  price_cents: 4900,
  agent_id: "nova",
  delivery_sla_hours: 2,
  deliverable_kind: "image",
  revisions_included: 2,
  inputs_schema: { type: "object", required: [], properties: {} },
  features: [],
  faq: [],
  category: "branding",
  tags: [],
  runner_type: "llm_text",
  runner_config: {},
  product_type: "one_off",
  is_active: false,
  is_featured: false,
  sort_order: 100,
};

interface Props {
  initial?: Partial<Product> & { id?: string };
  isNew?: boolean;
}

export default function ProductEditor({ initial, isNew = false }: Props) {
  const router = useRouter();
  const [p, setP] = useState<Product>({ ...defaultProduct, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuresRaw, setFeaturesRaw] = useState(p.features.join("\n"));
  const [tagsRaw, setTagsRaw] = useState(p.tags.join(", "));
  const [inputsSchemaRaw, setInputsSchemaRaw] = useState(
    JSON.stringify(p.inputs_schema, null, 2)
  );
  const [runnerConfigRaw, setRunnerConfigRaw] = useState(
    JSON.stringify(p.runner_config, null, 2)
  );
  const [faqRaw, setFaqRaw] = useState(JSON.stringify(p.faq, null, 2));

  function set<K extends keyof Product>(key: K, val: Product[K]) {
    setP((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      // Parse JSON fields
      const features = featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean);
      const tags = tagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      let inputs_schema: Record<string, unknown>;
      let runner_config: Record<string, unknown>;
      let faq: { q: string; a: string }[];
      try {
        inputs_schema = JSON.parse(inputsSchemaRaw);
      } catch {
        setError("inputs_schema no es JSON valido");
        setSaving(false);
        return;
      }
      try {
        runner_config = JSON.parse(runnerConfigRaw);
      } catch {
        setError("runner_config no es JSON valido");
        setSaving(false);
        return;
      }
      try {
        faq = JSON.parse(faqRaw);
      } catch {
        setError("FAQ no es JSON valido");
        setSaving(false);
        return;
      }

      const payload = { ...p, features, tags, inputs_schema, runner_config, faq };

      const url = isNew ? "/api/dashboard/catalog" : `/api/dashboard/catalog/${p.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar");
        setSaving(false);
        return;
      }
      router.push("/dashboard/catalog");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">
        {isNew ? "Nuevo producto" : "Editar producto"}
      </h1>
      <p className="text-white/60 text-sm mb-8">
        Los productos con runner declarativo se entregan automaticamente. Los "custom" requieren codigo.
      </p>

      <div className="space-y-6">
        {/* Basics */}
        <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] space-y-4">
          <h2 className="font-bold text-lg">Basicos</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug (URL)" required>
              <input
                value={p.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/\s/g, "-"))}
                disabled={!isNew}
                placeholder="logo-express"
                className={inputCls}
              />
            </Field>
            <Field label="Nombre" required>
              <input value={p.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Tagline (una linea)">
            <input value={p.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
          </Field>

          <Field label="Descripcion (parrafo)">
            <textarea
              value={p.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls + " min-h-[80px]"}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Precio (cents)" required>
              <input
                type="number"
                value={p.price_cents}
                onChange={(e) => set("price_cents", parseInt(e.target.value) || 0)}
                className={inputCls}
              />
              <span className="text-xs text-white/40">= {(p.price_cents / 100).toFixed(2)}€</span>
            </Field>
            <Field label="SLA (horas)">
              <input
                type="number"
                value={p.delivery_sla_hours}
                onChange={(e) => set("delivery_sla_hours", parseInt(e.target.value) || 1)}
                className={inputCls}
              />
            </Field>
            <Field label="Revisiones">
              <input
                type="number"
                value={p.revisions_included}
                onChange={(e) => set("revisions_included", parseInt(e.target.value) || 0)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        {/* Delivery config */}
        <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] space-y-4">
          <h2 className="font-bold text-lg">Entrega</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Agente responsable">
              <select value={p.agent_id} onChange={(e) => set("agent_id", e.target.value)} className={inputCls}>
                {AGENTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de entregable">
              <select value={p.deliverable_kind} onChange={(e) => set("deliverable_kind", e.target.value)} className={inputCls}>
                {DELIVERABLE_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Runner (como se entrega)">
            <select value={p.runner_type} onChange={(e) => set("runner_type", e.target.value)} className={inputCls}>
              {RUNNER_TYPES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <span className="text-xs text-white/40">
              Para llm_*: usa runner_config con prompt_template. Para custom: crea clase en web/lib/delivery/services.
            </span>
          </Field>

          <Field label="Runner config (JSON)">
            <textarea
              value={runnerConfigRaw}
              onChange={(e) => setRunnerConfigRaw(e.target.value)}
              className={inputCls + " font-mono text-xs min-h-[160px]"}
            />
            <span className="text-xs text-white/40">
              Ej: {"{"} "tier": "standard", "prompt_template": "Escribe... {"{"}{"{"}variable{"}"}{"}"}" {"}"}
            </span>
          </Field>

          <Field label="Inputs schema (JSON-Schema)">
            <textarea
              value={inputsSchemaRaw}
              onChange={(e) => setInputsSchemaRaw(e.target.value)}
              className={inputCls + " font-mono text-xs min-h-[200px]"}
            />
            <span className="text-xs text-white/40">
              Define los campos que pide el form post-pago.
            </span>
          </Field>
        </div>

        {/* Marketing */}
        <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] space-y-4">
          <h2 className="font-bold text-lg">Marketing</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <select value={p.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                <option value="">— ninguna —</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Tags (coma)">
              <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Features (una por linea)">
            <textarea
              value={featuresRaw}
              onChange={(e) => setFeaturesRaw(e.target.value)}
              className={inputCls + " min-h-[100px]"}
            />
          </Field>

          <Field label="FAQ (JSON array)">
            <textarea
              value={faqRaw}
              onChange={(e) => setFaqRaw(e.target.value)}
              className={inputCls + " font-mono text-xs min-h-[120px]"}
            />
          </Field>
        </div>

        {/* Publishing */}
        <div className="rounded-2xl p-6 bg-white/[0.03] border border-white/[0.06] space-y-4">
          <h2 className="font-bold text-lg">Publicacion</h2>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Tipo de producto">
              <select value={p.product_type} onChange={(e) => set("product_type", e.target.value)} className={inputCls}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Orden (sort_order)">
              <input
                type="number"
                value={p.sort_order}
                onChange={(e) => set("sort_order", parseInt(e.target.value) || 100)}
                className={inputCls}
              />
            </Field>
            <div className="flex flex-col justify-around">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={p.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                Publicado
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={p.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />
                Destacado
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/catalog")}
            className="flex-1 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-5 py-3 rounded-xl bg-olympus-gold text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : isNew ? "Crear producto" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/80 mb-1.5 block">
        {label}
        {required && <span className="text-olympus-gold ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:border-olympus-gold/50 focus:outline-none";
