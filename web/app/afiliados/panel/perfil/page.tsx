"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  email: string;
  referral_code: string;
  status: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  tax_id: string | null;
  payout_method: "iban" | "paypal" | "bizum" | "revolut" | "wise" | null;
  payout_iban: string | null;
  payout_paypal: string | null;
  payout_phone: string | null;
  marketing_consent: boolean;
  created_at: string;
  last_login_at: string | null;
};

export default function PerfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [nextPwd, setNextPwd] = useState("");

  useEffect(() => {
    fetch("/api/referrals/public/profile", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) { window.location.href = "/afiliados/login"; return null; }
        return r.ok ? r.json() : null;
      })
      .then((j) => setProfile(j?.profile ?? null))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!profile) return <p className="text-sm text-ink/60">Cargando…</p>;

  const update = (k: keyof Profile, v: unknown) =>
    setProfile((p) => (p ? { ...p, [k]: v } : p));

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/referrals/public/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          country: profile.country,
          tax_id: profile.tax_id,
          payout_method: profile.payout_method,
          payout_iban: profile.payout_iban,
          payout_paypal: profile.payout_paypal,
          payout_phone: profile.payout_phone,
          marketing_consent: profile.marketing_consent,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      setProfileMsg("Cambios guardados.");
    } catch (e: unknown) {
      setProfileMsg("Error: " + (e instanceof Error ? e.message : "fallo"));
    } finally {
      setSavingProfile(false);
    }
  };

  const changePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const r = await fetch("/api/referrals/public/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current: currentPwd, next: nextPwd }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Error");
      setPwdMsg("Contraseña actualizada.");
      setCurrentPwd("");
      setNextPwd("");
    } catch (e: unknown) {
      setPwdMsg("Error: " + (e instanceof Error ? e.message : "fallo"));
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-ink/10 bg-paper p-6">
        <h3 className="font-heading text-xl">Datos personales</h3>
        <p className="mt-1 text-sm text-ink/60">
          Estos datos los necesitamos para contactarte y para emitir tu factura.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Nombre completo">
            <input
              className="input"
              value={profile.full_name ?? ""}
              onChange={(e) => update("full_name", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input className="input" value={profile.email} disabled />
          </Field>
          <Field label="Teléfono / WhatsApp">
            <input
              className="input"
              value={profile.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>
          <Field label="País">
            <input
              className="input"
              value={profile.country ?? ""}
              onChange={(e) => update("country", e.target.value)}
              placeholder="ES"
            />
          </Field>
          <Field label="NIF / CIF (para emitir factura)">
            <input
              className="input"
              value={profile.tax_id ?? ""}
              onChange={(e) => update("tax_id", e.target.value)}
            />
          </Field>
          <Field label="Tu enlace de afiliado">
            <input className="input font-mono text-xs" value={`https://pacameagencia.com/?ref=${profile.referral_code}`} disabled />
          </Field>
        </div>
      </section>

      <section className="rounded-md border border-ink/10 bg-paper p-6">
        <h3 className="font-heading text-xl">Cómo cobras</h3>
        <p className="mt-1 text-sm text-ink/60">
          Elige tu método preferido. Pagamos una vez al mes lo que esté en estado <strong>aprobado</strong>.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Método de cobro">
            <select
              className="input"
              value={profile.payout_method ?? ""}
              onChange={(e) => update("payout_method", e.target.value || null)}
            >
              <option value="">Selecciona…</option>
              <option value="iban">Transferencia (IBAN)</option>
              <option value="paypal">PayPal</option>
              <option value="bizum">Bizum</option>
              <option value="revolut">Revolut</option>
              <option value="wise">Wise</option>
            </select>
          </Field>

          {profile.payout_method === "iban" && (
            <Field label="IBAN">
              <input
                className="input font-mono"
                value={profile.payout_iban ?? ""}
                onChange={(e) => update("payout_iban", e.target.value)}
                placeholder="ES.. .... .... .... .... ...."
              />
            </Field>
          )}
          {profile.payout_method === "paypal" && (
            <Field label="Email PayPal">
              <input
                className="input"
                value={profile.payout_paypal ?? ""}
                onChange={(e) => update("payout_paypal", e.target.value)}
              />
            </Field>
          )}
          {(profile.payout_method === "bizum" ||
            profile.payout_method === "revolut" ||
            profile.payout_method === "wise") && (
            <Field label="Teléfono / handle">
              <input
                className="input"
                value={profile.payout_phone ?? ""}
                onChange={(e) => update("payout_phone", e.target.value)}
              />
            </Field>
          )}
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={profile.marketing_consent}
            onChange={(e) => update("marketing_consent", e.target.checked)}
            className="mt-0.5"
          />
          Quiero recibir emails con contenido nuevo y notificaciones de comisiones.
        </label>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="rounded-sm bg-terracotta-500 px-5 py-2 text-sm font-medium text-paper hover:bg-terracotta-600 disabled:opacity-50"
          >
            {savingProfile ? "Guardando…" : "Guardar cambios"}
          </button>
          {profileMsg && <span className="text-sm text-ink/70">{profileMsg}</span>}
        </div>
      </section>

      <section className="rounded-md border border-ink/10 bg-paper p-6">
        <h3 className="font-heading text-xl">Cambiar contraseña</h3>
        <form onSubmit={changePwd} className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Contraseña actual">
            <input
              type="password"
              className="input"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label="Nueva contraseña (mínimo 8)">
            <input
              type="password"
              className="input"
              value={nextPwd}
              onChange={(e) => setNextPwd(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={savingPwd}
              className="rounded-sm border border-ink/15 px-5 py-2 text-sm font-medium text-ink hover:bg-ink/5 disabled:opacity-50"
            >
              {savingPwd ? "Cambiando…" : "Cambiar contraseña"}
            </button>
            {pwdMsg && <span className="text-sm text-ink/70">{pwdMsg}</span>}
          </div>
        </form>
      </section>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.5rem 0.625rem;
          border: 1px solid rgba(26, 24, 19, 0.15);
          background: #f4efe3;
          border-radius: 0.125rem;
          font-size: 0.875rem;
          color: #1a1813;
        }
        :global(.input:disabled) { opacity: 0.6; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink/80">{label}</span>
      {children}
    </label>
  );
}
