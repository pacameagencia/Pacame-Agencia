import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Handles Gmail/Yahoo One-Click Unsubscribe (RFC 8058).
 *
 * Resend adds `List-Unsubscribe: <mailto:unsubscribe@...>, <https://.../unsubscribe>`
 * and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`. Gmail POSTs here
 * when the user clicks "Unsubscribe" in the Gmail UI.
 *
 * We mark the email as unsubscribed in the `leads` / `clients` tables if we
 * have their record. Always returns 200 to avoid bounces.
 */

export async function POST(request: NextRequest) {
  let email: string | null = null;

  // Gmail uses multipart/form-data or x-www-form-urlencoded
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      email = body.email || null;
    } else {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        email = (formData.get("email") as string) || null;
      }
    }
  } catch {
    // ignore parse errors
  }

  // Also accept ?email=
  if (!email) {
    const { searchParams } = new URL(request.url);
    email = searchParams.get("email");
  }

  if (email) {
    try {
      const supabase = createServerSupabase();
      // Best-effort: mark email as unsubscribed in both tables
      await supabase
        .from("leads")
        .update({ unsubscribed: true, unsubscribed_at: new Date().toISOString() })
        .eq("email", email);
      await supabase
        .from("clients")
        .update({ email_unsubscribed: true })
        .eq("email", email);
    } catch (err) {
      console.warn("[unsubscribe] db update failed:", err instanceof Error ? err.message : "unknown");
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  // Redirect to the page for GET requests (user clicked the mailto or visited URL)
  return NextResponse.redirect(new URL("/unsubscribe", request.url));
}
