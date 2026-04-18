import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { clientAuthLimiter, getClientIp } from "@/lib/security/rate-limit";
import { getLogger } from "@/lib/observability/logger";

type ActionPayload =
  | { action: "login"; email: string; password: string }
  | { action: "verify" }
  | { action: "logout" }
  | { action: "reset-request"; email: string }
  | { action: "reset-confirm"; email: string; code: string; new_password: string }
  | { action: "change-password"; old_password: string; new_password: string };

const COOKIE_NAME = "pacame_client_auth";
const TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function setCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
  // CSRF double-submit cookie (no httpOnly — el frontend la lee)
  const csrfToken = crypto.randomBytes(32).toString("hex");
  response.cookies.set("pacame_csrf", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
  return response;
}

function clearCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

function generateResetCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActionPayload;
    const supabase = createServerSupabase();

    // Rate limit solo para acciones sensibles (login/reset). Verify/logout
    // son baratas y el 429 aqui desloguearia al usuario en cada refresco.
    const sensitiveActions = new Set<string>([
      "login",
      "reset-request",
      "reset-confirm",
      "change-password",
    ]);
    if (sensitiveActions.has(body.action)) {
      const ip = getClientIp(request);
      const email = (body as { email?: string }).email?.toLowerCase() || "anon";
      const rl = await clientAuthLimiter.limit(`${ip}:${email}`);
      if (!rl.success) {
        const retrySec = Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000));
        return NextResponse.json(
          {
            error: "Demasiados intentos. Espera unos minutos e intentalo de nuevo.",
            retry_after: retrySec,
          },
          {
            status: 429,
            headers: { "Retry-After": String(retrySec) },
          }
        );
      }
    }

    switch (body.action) {
      // ─── LOGIN ──────────────────────────────────────────────
      case "login": {
        const { email, password } = body;

        if (!email || !password) {
          return NextResponse.json(
            { error: "Email y password son obligatorios" },
            { status: 400 }
          );
        }

        const { data: client, error: fetchError } = await supabase
          .from("clients")
          .select("id, name, email, password_hash")
          .eq("email", email.trim().toLowerCase())
          .single();

        if (fetchError || !client) {
          return NextResponse.json(
            { error: "Credenciales incorrectas" },
            { status: 401 }
          );
        }

        if (!client.password_hash) {
          return NextResponse.json(
            { error: "Cuenta sin password. Usa el enlace de acceso rapido o contacta con soporte." },
            { status: 401 }
          );
        }

        const valid = await bcrypt.compare(password, client.password_hash);
        if (!valid) {
          return NextResponse.json(
            { error: "Credenciales incorrectas" },
            { status: 401 }
          );
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + TOKEN_MAX_AGE * 1000).toISOString();

        const { error: updateError } = await supabase
          .from("clients")
          .update({
            auth_token: token,
            auth_token_expires: expiresAt,
            last_login: new Date().toISOString(),
          })
          .eq("id", client.id);

        if (updateError) {
          getLogger().error({ err: updateError }, "[client-auth] login update error");
          return NextResponse.json(
            { error: "Error interno al iniciar sesion" },
            { status: 500 }
          );
        }

        const response = NextResponse.json({
          success: true,
          token,
          client: { id: client.id, name: client.name, email: client.email },
        });

        return setCookie(response, token);
      }

      // ─── VERIFY ─────────────────────────────────────────────
      case "verify": {
        const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

        if (!cookieToken) {
          return NextResponse.json(
            { error: "No autenticado" },
            { status: 401 }
          );
        }

        const { data: client, error: fetchError } = await supabase
          .from("clients")
          .select("id, name, email, business_name, status, avatar_url, onboarding_completed")
          .eq("auth_token", cookieToken)
          .gt("auth_token_expires", new Date().toISOString())
          .single();

        if (fetchError || !client) {
          const response = NextResponse.json(
            { error: "Sesion expirada o invalida" },
            { status: 401 }
          );
          return clearCookie(response);
        }

        return NextResponse.json({ success: true, client });
      }

      // ─── LOGOUT ─────────────────────────────────────────────
      case "logout": {
        const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

        if (cookieToken) {
          await supabase
            .from("clients")
            .update({ auth_token: null })
            .eq("auth_token", cookieToken);
        }

        const response = NextResponse.json({ success: true });
        return clearCookie(response);
      }

      // ─── RESET REQUEST ──────────────────────────────────────
      case "reset-request": {
        const { email } = body;

        if (!email) {
          return NextResponse.json(
            { error: "Email obligatorio" },
            { status: 400 }
          );
        }

        const { data: client } = await supabase
          .from("clients")
          .select("id, name, email")
          .eq("email", email.trim().toLowerCase())
          .single();

        // Always return success to prevent email enumeration
        if (!client) {
          return NextResponse.json({ success: true });
        }

        const code = generateResetCode();
        const codeExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        await supabase
          .from("clients")
          .update({
            auth_token: code,
            auth_token_expires: codeExpires,
          })
          .eq("id", client.id);

        const emailBody = wrapEmailTemplate(
          `Hola ${client.name?.split(" ")[0] || ""},\n\nHas solicitado restablecer tu password en PACAME.\n\nTu codigo de verificacion es:\n\n${code}\n\nEste codigo expira en 1 hora.\n\nSi no has solicitado este cambio, ignora este email.`,
          {
            preheader: `Tu codigo de verificacion PACAME: ${code}`,
          }
        );

        await sendEmail({
          to: client.email,
          subject: "Codigo de verificacion — PACAME",
          html: emailBody,
          tags: [{ name: "type", value: "password_reset" }],
        });

        return NextResponse.json({ success: true });
      }

      // ─── RESET CONFIRM ──────────────────────────────────────
      case "reset-confirm": {
        const { email, code, new_password } = body;

        if (!email || !code || !new_password) {
          return NextResponse.json(
            { error: "Todos los campos son obligatorios" },
            { status: 400 }
          );
        }

        if (new_password.length < 8) {
          return NextResponse.json(
            { error: "El password debe tener al menos 8 caracteres" },
            { status: 400 }
          );
        }

        const { data: client, error: fetchError } = await supabase
          .from("clients")
          .select("id, auth_token, auth_token_expires")
          .eq("email", email.trim().toLowerCase())
          .single();

        if (fetchError || !client) {
          return NextResponse.json(
            { error: "Codigo invalido o expirado" },
            { status: 400 }
          );
        }

        if (
          client.auth_token !== code ||
          !client.auth_token_expires ||
          new Date(client.auth_token_expires) < new Date()
        ) {
          return NextResponse.json(
            { error: "Codigo invalido o expirado" },
            { status: 400 }
          );
        }

        const hashedPassword = await bcrypt.hash(new_password, 12);

        const { error: updateError } = await supabase
          .from("clients")
          .update({
            password_hash: hashedPassword,
            auth_token: null,
            auth_token_expires: null,
          })
          .eq("id", client.id);

        if (updateError) {
          getLogger().error({ err: updateError }, "[client-auth] reset-confirm update error");
          return NextResponse.json(
            { error: "Error al actualizar el password" },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      // ─── CHANGE PASSWORD ────────────────────────────────────
      case "change-password": {
        const cookieToken = request.cookies.get(COOKIE_NAME)?.value;

        if (!cookieToken) {
          return NextResponse.json(
            { error: "No autenticado" },
            { status: 401 }
          );
        }

        const { old_password, new_password } = body;

        if (!old_password || !new_password) {
          return NextResponse.json(
            { error: "Ambos campos son obligatorios" },
            { status: 400 }
          );
        }

        if (new_password.length < 8) {
          return NextResponse.json(
            { error: "El nuevo password debe tener al menos 8 caracteres" },
            { status: 400 }
          );
        }

        const { data: client, error: fetchError } = await supabase
          .from("clients")
          .select("id, password_hash")
          .eq("auth_token", cookieToken)
          .gt("auth_token_expires", new Date().toISOString())
          .single();

        if (fetchError || !client) {
          return NextResponse.json(
            { error: "Sesion expirada" },
            { status: 401 }
          );
        }

        if (!client.password_hash) {
          return NextResponse.json(
            { error: "No tienes password configurado" },
            { status: 400 }
          );
        }

        const valid = await bcrypt.compare(old_password, client.password_hash);
        if (!valid) {
          return NextResponse.json(
            { error: "Password actual incorrecto" },
            { status: 401 }
          );
        }

        const hashedPassword = await bcrypt.hash(new_password, 12);

        const { error: updateError } = await supabase
          .from("clients")
          .update({ password_hash: hashedPassword })
          .eq("id", client.id);

        if (updateError) {
          getLogger().error({ err: updateError }, "[client-auth] change-password update error");
          return NextResponse.json(
            { error: "Error al cambiar el password" },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      default: {
        return NextResponse.json(
          { error: "Accion no reconocida" },
          { status: 400 }
        );
      }
    }
  } catch (err) {
    getLogger().error({ err }, "[client-auth] Unexpected error");
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
