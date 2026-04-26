/**
 * /pacame-gpt/login — Login + Signup (trial automático) en una sola pantalla.
 *
 * UX: dos tabs ("Entrar" / "Crear cuenta gratis"). El signup llama al endpoint
 * canónico de trial (`/api/products/pacame-gpt/trial`) que ya hace user +
 * sub trialing 14 días + cookie en una pasada.
 *
 * Si el login falla con 404 (email no existe) sugerimos cambiar a Crear cuenta.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function PacameGPTLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/products/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, redirect_to: "/pacame-gpt" }),
      });
      const json = await res.json();
      if (res.status === 404) {
        setError("Ese email no está registrado. Cámbiate a 'Crear cuenta gratis'.");
        setMode("signup");
        return;
      }
      if (!res.ok || !json.ok) {
        setError(humanError(json.error || "login_failed"));
        return;
      }
      router.push(json.redirect || "/pacame-gpt");
    } catch {
      setError("No me he podido conectar. Inténtalo de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/products/pacame-gpt/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(humanError(json.error || "signup_failed"));
        return;
      }
      router.push(json.redirect || "/pacame-gpt");
    } catch {
      setError("No me he podido conectar. Inténtalo de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4efe3",
        color: "#1a1813",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 18px",
        fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          borderRadius: 18,
          padding: "28px 24px",
          boxShadow: "0 12px 32px rgba(26,24,19,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Link
            href="/pacame-gpt"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              color: "#1a1813",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(135deg,#b54e30,#e8b730)",
                color: "#f4efe3",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontWeight: 600,
                fontSize: 17,
              }}
            >
              L
            </span>
            <span
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              PACAME GPT
            </span>
          </Link>
          <p style={{ color: "#6e6858", fontSize: 13, marginTop: 6 }}>
            con Lucía, tu IA en español
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#ebe3d0",
            borderRadius: 10,
            padding: 4,
            marginBottom: 18,
          }}
        >
          <button
            onClick={() => setMode("login")}
            style={tabStyle(mode === "login")}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode("signup")}
            style={tabStyle(mode === "signup")}
          >
            Crear cuenta gratis
          </button>
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
          {mode === "signup" && (
            <Field
              label="Cómo te llamas (opcional)"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="María"
              autoComplete="name"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tucorreo@gmail.com"
            autoComplete="email"
            required
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "Al menos 8 caracteres" : "Tu contraseña"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
          />

          {error && (
            <p
              style={{
                background: "rgba(181,78,48,0.1)",
                color: "#7a2e18",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                marginBottom: 10,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={primaryBtnStyle(loading || !email || !password)}
          >
            {loading
              ? "Un momento…"
              : mode === "login"
                ? "Entrar"
                : "Empezar 14 días gratis"}
          </button>

          {mode === "signup" && (
            <p style={{ fontSize: 12, color: "#6e6858", textAlign: "center", marginTop: 12 }}>
              14 días sin tarjeta. Después 9,90€/mes o sigues con la versión gratis 20 msg/día.
            </p>
          )}
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
          <Link
            href="/pacame-gpt"
            style={{ color: "#6e6858", textDecoration: "none" }}
          >
            Volver al chat
          </Link>
        </div>
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
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 13, color: "#3a362c", marginBottom: 4 }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        style={{
          width: "100%",
          padding: "11px 12px",
          background: "#f9f5ea",
          border: "1px solid rgba(26,24,19,0.1)",
          borderRadius: 10,
          fontSize: 15,
          color: "#1a1813",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </label>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    border: "none",
    background: active ? "#ffffff" : "transparent",
    padding: "9px 12px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: active ? "#1a1813" : "#6e6858",
    boxShadow: active ? "0 2px 6px rgba(26,24,19,0.06)" : "none",
    fontFamily: "inherit",
  };
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "13px 16px",
    background: disabled ? "rgba(26,24,19,0.4)" : "#1a1813",
    color: "#f4efe3",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background .2s ease",
    fontFamily: "inherit",
  };
}

function humanError(code: string): string {
  switch (code) {
    case "invalid_password":
      return "La contraseña no es correcta. Vuelve a intentarlo.";
    case "user_has_no_password":
      return "Esta cuenta aún no tiene contraseña. Crea una nueva con 'Crear cuenta gratis'.";
    case "user_not_found":
      return "Ese email no está registrado.";
    case "valid email required":
      return "Ese email no parece válido.";
    default:
      if (code.includes("password must be")) return "La contraseña tiene que tener al menos 8 caracteres.";
      return "Algo no ha funcionado. Inténtalo otra vez.";
  }
}
