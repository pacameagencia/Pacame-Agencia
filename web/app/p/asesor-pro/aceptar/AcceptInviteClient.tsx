"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowUpRight, Check } from "lucide-react";
import { isValidEmail } from "@/lib/validators";

interface InviteData {
  valid: boolean;
  client?: { fiscal_name: string; nif: string; email: string | null };
  asesor_name?: string;
}

export default function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; full_name?: string }>({});

  useEffect(() => {
    if (!token) {
      setInvite({ valid: false });
      setLoadingInvite(false);
      return;
    }
    fetch(`/api/products/asesor-pro/accept-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => {
        setInvite(j);
        if (j.client?.email) setEmail(j.client.email);
        if (j.client?.fiscal_name && !fullName) setFullName(j.client.fiscal_name);
      })
      .catch(() => setInvite({ valid: false }))
      .finally(() => setLoadingInvite(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe: typeof fieldErrors = {};
    if (!isValidEmail(email)) fe.email = "Introduce un email válido.";
    if (fullName.trim().length < 2) fe.full_name = "Indica tu nombre completo.";
    if (password.length < 8) fe.password = "Mínimo 8 caracteres.";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/products/asesor-pro/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, full_name: fullName, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "No se pudo aceptar la invitación");
        return;
      }
      router.push(json.redirect ?? "/app/asesor-pro/cliente");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInvite) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-ink" />
      </main>
    );
  }

  if (!invite?.valid) {
    return (
      <main className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-rose-alert mb-4" />
          <h1 className="font-display text-ink mb-3" style={{ fontSize: "2rem", fontWeight: 500, letterSpacing: "-0.02em" }}>
            Invitación no válida
          </h1>
          <p className="font-sans text-ink-soft mb-6">
            El enlace ha expirado o ya se usó. Pide a tu asesor que te envíe uno nuevo.
          </p>
          <Link
            href="/p/asesor-pro"
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-ink text-ink hover:bg-ink hover:text-paper transition-colors font-sans text-sm"
          >
            Volver
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper py-24 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Banda */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-ink">
          <Link href="/" className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink hover:text-terracotta-500">
            ← PACAME / AsesorPro
          </Link>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            Invitación · {invite.asesor_name}
          </span>
        </div>

        <span className="kicker block mb-4" style={{ color: "#283B70" }}>
          Te están invitando · 1 minuto
        </span>
        <h1
          className="font-display text-ink mb-6 text-balance"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: "0.95", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          {invite.asesor_name} te invita a{" "}
          <span
            className="italic font-light"
            style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
          >
            facturar fácil.
          </span>
        </h1>

        <div className="bg-sand-100 border-2 border-ink/15 p-4 mb-8">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">
            Tu negocio en su sistema
          </span>
          <div className="font-sans text-ink">
            <span className="text-[16px] font-medium block">{invite.client?.fiscal_name}</span>
            <span className="font-mono text-[12px] text-ink-soft">NIF {invite.client?.nif}</span>
          </div>
        </div>

        <p className="font-sans text-ink-soft mb-8">
          Crea una cuenta para acceder a tu panel. Vas a poder facturar en 3 clicks, subir tickets desde el móvil, ver tu IVA del trimestre y chatear con {invite.asesor_name} sin salir del sistema. <strong className="text-ink">Es gratis para ti</strong> mientras tu asesor tenga su plan activo.
        </p>

        <form onSubmit={submit} className="bg-paper border-2 border-ink p-6 space-y-4" style={{ boxShadow: "5px 5px 0 #B54E30" }}>
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tu@email.com"
            required
            error={fieldErrors.email}
          />
          <Field
            label="Nombre"
            type="text"
            value={fullName}
            onChange={setFullName}
            placeholder="Tu nombre"
            required
            error={fieldErrors.full_name}
          />
          <Field
            label="Contraseña (mínimo 8 caracteres)"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder=""
            required
            minLength={8}
            error={fieldErrors.password}
          />

          {error && (
            <div className="flex items-start gap-3 p-3 border border-rose-alert/40 bg-rose-alert/10 text-sm text-rose-alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !email || !fullName || password.length < 8}
            className="w-full inline-flex items-center justify-center gap-3 px-7 py-4 bg-terracotta-500 text-paper font-sans font-medium text-[15px] tracking-wide transition-all disabled:opacity-50 hover:bg-terracotta-600"
            style={{ boxShadow: "5px 5px 0 #1A1813" }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando tu cuenta...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Aceptar y entrar a mi panel
                <ArrowUpRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
  error,
}: {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        aria-invalid={Boolean(error)}
        className={`w-full px-4 py-3 bg-paper border ${
          error ? "border-rose-alert" : "border-ink/30"
        } text-ink text-[15px] focus:outline-none focus:border-ink`}
      />
      {error && (
        <span className="block mt-1 font-sans text-[12px] text-rose-alert">{error}</span>
      )}
    </label>
  );
}
