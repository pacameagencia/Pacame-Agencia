"use client";

/**
 * Dark Academy · Form de captura email para lead magnet.
 *
 * POST → /api/academy/lead-magnet-capture
 * Maneja estados: idle / submitting / success / error.
 * Cero menciones PACAME (R7 dark-academy).
 */

import { useState, type FormEvent } from "react";

interface AcademyCaptureFormProps {
  magnetSlug: string;
  magnetTitle: string;
}

type Status = "idle" | "submitting" | "success" | "already" | "error";

const C = {
  text: "#F5F5F0",
  textMid: "#A1A1AA",
  textLow: "#71717A",
  gold: "#D4AF37",
  bg: "#0A0A0A",
  bgCard: "#161616",
  border: "rgba(255,255,255,0.12)",
  borderFocus: "rgba(212,175,55,0.6)",
  error: "#E11D48",
  ok: "#4ADE80",
};

export default function AcademyCaptureForm({ magnetSlug, magnetTitle }: AcademyCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [accept, setAccept] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    if (!email.trim() || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
      setErrorMsg("Necesitamos un email válido.");
      setStatus("error");
      return;
    }
    if (!accept) {
      setErrorMsg("Marca la casilla de consentimiento para continuar.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/academy/lead-magnet-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          lead_magnet_slug: magnetSlug,
          firstname: firstname.trim() || undefined,
          source_utm:
            typeof window !== "undefined"
              ? new URL(window.location.href).searchParams.get("utm") ?? undefined
              : undefined,
          locale: "es",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error ?? `Error ${res.status}. Inténtalo en un minuto.`);
        setStatus("error");
        return;
      }

      if (data.status === "already_exists") {
        setStatus("already");
      } else {
        setStatus("success");
      }
    } catch (err) {
      console.error("[academy-capture-form]", err);
      setErrorMsg("Problema de red. Inténtalo en un minuto.");
      setStatus("error");
    }
  }

  if (status === "success" || status === "already") {
    return (
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.gold}`,
          padding: 28,
          borderRadius: 8,
        }}
      >
        <h3
          style={{
            fontFamily: '"Space Grotesk", Inter, system-ui, sans-serif',
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 12px",
            color: C.gold,
          }}
        >
          {status === "success" ? "Listo. Revisa tu email." : "Ya estabas registrado."}
        </h3>
        <p style={{ fontSize: 15, color: C.textMid, margin: "0 0 8px", lineHeight: 1.6 }}>
          {status === "success"
            ? `Te enviamos "${magnetTitle}" a ${email}. Llega en menos de 2 minutos. Si no lo ves, mira en promociones o spam.`
            : `Ya te habíamos enviado "${magnetTitle}" antes. Si no lo encuentras, escríbenos a support@darkroomcreative.cloud.`}
        </p>
        <p style={{ fontSize: 13, color: C.textLow, margin: 0 }}>
          Cuando termines de revisar el material, lo siguiente es continuar con la academia.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        padding: 28,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <label
          htmlFor="firstname"
          style={{ display: "block", fontSize: 12, color: C.textMid, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
          Tu nombre (opcional)
        </label>
        <input
          id="firstname"
          type="text"
          name="firstname"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          maxLength={80}
          autoComplete="given-name"
          placeholder="Para personalizar el email"
          style={{
            width: "100%",
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "12px 14px",
            color: C.text,
            fontSize: 15,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          style={{ display: "block", fontSize: 12, color: C.textMid, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
          Email *
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="tu@email.com"
          style={{
            width: "100%",
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "12px 14px",
            color: C.text,
            fontSize: 15,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <label
        htmlFor="accept-newsletter"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontSize: 13,
          color: C.textMid,
          lineHeight: 1.55,
          marginTop: 4,
          cursor: "pointer",
        }}
      >
        <input
          id="accept-newsletter"
          type="checkbox"
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          required
          style={{ marginTop: 3, accentColor: C.gold, cursor: "pointer" }}
        />
        <span>
          Acepto recibir el material en mi email y la newsletter quincenal Dark Academy.
          Puedo darme de baja con 1 clic. Sin spam, sin promesas imposibles.
        </span>
      </label>

      {status === "error" && errorMsg && (
        <p
          style={{
            color: C.error,
            fontSize: 13,
            margin: 0,
            padding: "8px 12px",
            background: "rgba(225,29,72,0.08)",
            border: "1px solid rgba(225,29,72,0.25)",
            borderRadius: 4,
          }}
        >
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        style={{
          background: status === "submitting" ? "rgba(212,175,55,0.6)" : C.gold,
          color: C.bg,
          padding: "14px 28px",
          border: "none",
          borderRadius: 4,
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: status === "submitting" ? "wait" : "pointer",
          fontFamily: "inherit",
          marginTop: 4,
        }}
      >
        {status === "submitting" ? "Enviando…" : `Descargar · ${magnetTitle}`}
      </button>

      <p style={{ fontSize: 11, color: C.textLow, margin: "4px 0 0", lineHeight: 1.5 }}>
        Procesamos tu email con Supabase + Resend (UE). Política de privacidad:&nbsp;
        <a href="/legal/privacidad" style={{ color: C.textMid }}>
          darkroomcreative.cloud/legal/privacidad
        </a>
        .
      </p>
    </form>
  );
}
