"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Brand = { slug: string; name: string; description: string | null };

function RegistroContent() {
  const router = useRouter();
  const search = useSearchParams();
  const presetBrand = search.get("brand") || "pacame";

  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    country: "ES",
    marketing_consent: true,
    terms_accepted: false,
    brand_slug: presetBrand,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referrals/public/brands")
      .then((r) => r.json())
      .then((j: { brands: Brand[] }) => {
        setBrands(j.brands);
        if (presetBrand && !j.brands.some((b) => b.slug === presetBrand) && j.brands[0]) {
          setForm((f) => ({ ...f, brand_slug: j.brands[0].slug }));
        }
      })
      .catch(() => setBrands([]));
  }, [presetBrand]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.terms_accepted) {
      setError("Debes aceptar los términos del programa.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/referrals/public/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(translateError(data.error));
      router.push("/afiliados/panel?welcome=1");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-heading text-3xl">Crea tu cuenta de afiliado</h1>
      <p className="mt-2 text-sm text-ink/60">
        En 30 segundos tienes tu enlace único y acceso al panel pro.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Marca que quieres vender" required>
          {brands === null ? (
            <p className="text-sm text-ink/60">Cargando marcas…</p>
          ) : (
            <select
              value={form.brand_slug}
              onChange={(e) => setForm({ ...form, brand_slug: e.target.value })}
              className="input"
            >
              {brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <p className="mt-1 text-xs text-ink/55">
            Solo verás contenido de venta de esta marca. Puedes pedir acceso a
            otras desde tu panel después.
          </p>
        </Field>

        <Field label="Nombre completo" required>
          <input
            type="text" required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="input" autoComplete="name"
          />
        </Field>
        <Field label="Email" required>
          <input
            type="email" required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input" autoComplete="email"
          />
        </Field>
        <Field label="Contraseña (mínimo 8 caracteres)" required>
          <input
            type="password" required minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input" autoComplete="new-password"
          />
        </Field>
        <Field label="Teléfono / WhatsApp (opcional)">
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input" placeholder="+34 ..."
            autoComplete="tel"
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={form.marketing_consent}
            onChange={(e) => setForm({ ...form, marketing_consent: e.target.checked })}
            className="mt-0.5"
          />
          Acepto recibir emails con contenido nuevo, mejoras del programa y
          notificaciones de comisiones.
        </label>

        <label className="flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox" required
            checked={form.terms_accepted}
            onChange={(e) => setForm({ ...form, terms_accepted: e.target.checked })}
            className="mt-0.5"
          />
          He leído y acepto los{" "}
          <Link href="/afiliados/terminos" target="_blank" className="text-terracotta-500 underline hover:no-underline">
            términos del programa
          </Link>
          {" "}y la política de privacidad.
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
          {loading ? "Creando cuenta…" : "Crear cuenta y entrar"}
        </button>

        <p className="text-center text-sm text-ink/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/afiliados/login" className="text-terracotta-500 hover:underline">
            Accede aquí
          </Link>
        </p>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border: 1px solid rgba(26, 24, 19, 0.15);
          background: #f4efe3;
          border-radius: 0.125rem;
          font-size: 0.875rem;
          color: #1a1813;
        }
        :global(.input:focus) {
          outline: 2px solid #b54e30;
          outline-offset: -1px;
        }
      `}</style>
    </main>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-16 text-sm text-ink/60">Cargando…</main>}>
      <RegistroContent />
    </Suspense>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink/80">
        {label} {required && <span className="text-terracotta-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function translateError(code: string | undefined): string {
  switch (code) {
    case "invalid_email": return "Email no válido.";
    case "weak_password": return "La contraseña debe tener al menos 8 caracteres.";
    case "name_required": return "Falta el nombre.";
    case "email_in_use": return "Este email ya está registrado. Accede en su lugar.";
    case "invalid_brand": return "Marca no válida. Recarga la página.";
    case "terms_required": return "Debes aceptar los términos del programa.";
    default: return "No se ha podido crear la cuenta. Inténtalo de nuevo.";
  }
}
