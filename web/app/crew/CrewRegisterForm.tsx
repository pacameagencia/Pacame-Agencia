"use client";

/**
 * Formulario inline de registro DarkRoom Crew.
 * POST a /api/darkroom/crew/register · al éxito redirige al dashboard del code.
 */

import { useState, type FormEvent } from "react";

type PayoutMethod = "paypal" | "sepa" | "manual";

export default function CrewRegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("paypal");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [sepaIban, setSepaIban] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; dashboard_url: string } | null>(null);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0A0A0A",
    color: "#E6E6E6",
    border: "1px solid rgba(207,255,0,0.16)",
    borderRadius: 4,
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#888",
    marginBottom: 6,
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        payout_method: payoutMethod,
      };
      if (phone.trim()) body.phone = phone.trim();
      if (payoutMethod === "paypal") body.payout_email = payoutEmail.trim().toLowerCase();
      if (payoutMethod === "sepa") body.sepa_iban = sepaIban.replace(/\s+/g, "").toUpperCase();

      const res = await fetch("/api/darkroom/crew/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string; dashboard_url?: string; error?: string };
      if (!res.ok || !data.ok || !data.code || !data.dashboard_url) {
        setError(data.error ?? `Error ${res.status}`);
        setSubmitting(false);
        return;
      }
      setSuccess({ code: data.code, dashboard_url: data.dashboard_url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          background: "#141414",
          border: "1px solid #CFFF00",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Anton', 'Impact', sans-serif",
            fontSize: 28,
            color: "#CFFF00",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Estás dentro
        </div>
        <p style={{ color: "#B5B5B5", marginBottom: 16 }}>Tu code:</p>
        <div
          style={{
            padding: 14,
            background: "#0A0A0A",
            border: "1px dashed #CFFF00",
            borderRadius: 4,
            color: "#CFFF00",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 18,
            letterSpacing: 1,
            marginBottom: 24,
          }}
        >
          {success.code}
        </div>
        <a
          href={success.dashboard_url}
          style={{
            display: "inline-block",
            background: "#CFFF00",
            color: "#0A0A0A",
            padding: "12px 28px",
            borderRadius: 4,
            textDecoration: "none",
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          IR A MI PANEL
        </a>
        <p style={{ marginTop: 16, color: "#666", fontSize: 12 }}>
          Te hemos enviado el welcome con todos los detalles a {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div>
        <label htmlFor="cr-name" style={labelStyle}>Nombre</label>
        <input
          id="cr-name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lucia Motion"
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="cr-email" style={labelStyle}>Email</label>
        <input
          id="cr-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="lucia@tu-dominio.com"
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="cr-phone" style={labelStyle}>Teléfono (opcional)</label>
        <input
          id="cr-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+34 600 000 000"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>Método de cobro</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["paypal", "sepa", "manual"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPayoutMethod(m)}
              style={{
                ...inputStyle,
                width: "auto",
                cursor: "pointer",
                background: payoutMethod === m ? "#CFFF00" : "#0A0A0A",
                color: payoutMethod === m ? "#0A0A0A" : "#E6E6E6",
                fontWeight: payoutMethod === m ? 700 : 400,
                textTransform: "uppercase",
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {payoutMethod === "paypal" && (
        <div>
          <label htmlFor="cr-paypal" style={labelStyle}>PayPal email</label>
          <input
            id="cr-paypal"
            type="email"
            required
            value={payoutEmail}
            onChange={(e) => setPayoutEmail(e.target.value)}
            placeholder="cobros@tu-paypal.com"
            style={inputStyle}
          />
        </div>
      )}
      {payoutMethod === "sepa" && (
        <div>
          <label htmlFor="cr-iban" style={labelStyle}>IBAN SEPA</label>
          <input
            id="cr-iban"
            type="text"
            required
            value={sepaIban}
            onChange={(e) => setSepaIban(e.target.value)}
            placeholder="ES12 3456 7890 1234 5678 9012"
            style={inputStyle}
          />
        </div>
      )}
      {error && (
        <div
          style={{
            padding: 12,
            border: "1px solid #FF3B3B",
            borderRadius: 4,
            color: "#FF3B3B",
            background: "rgba(255,59,59,0.06)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          background: "#CFFF00",
          color: "#0A0A0A",
          padding: "14px 32px",
          border: 0,
          borderRadius: 4,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 0.5,
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.6 : 1,
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {submitting ? "Creando code…" : "ENTRAR EN EL CREW"}
      </button>
      <p style={{ color: "#666", fontSize: 12, textAlign: "center", marginTop: 4 }}>
        Sin compromiso. Te llega un code + link a tu panel personal.
      </p>
    </form>
  );
}
