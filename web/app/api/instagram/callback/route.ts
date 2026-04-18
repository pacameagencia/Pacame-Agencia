import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/instagram";
import { notifyHotLead } from "@/lib/telegram";
import { getLogger } from "@/lib/observability/logger";

/**
 * Instagram OAuth Callback
 *
 * Instagram redirects here after the user authorizes the app.
 * Exchanges the code for a long-lived access token.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    const errorDesc = request.nextUrl.searchParams.get("error_description") || "Unknown error";
    return NextResponse.redirect(
      new URL(`/dashboard?ig_error=${encodeURIComponent(errorDesc)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const redirectUri = `${request.nextUrl.origin}/api/instagram/callback`;

  try {
    const result = await exchangeCodeForToken(code, redirectUri);

    // Notify Pablo via Telegram
    await notifyHotLead({
      name: "Instagram conectado",
      score: 5,
      source: "instagram-oauth",
      problem: `Token OK. Account ID: ${result.userId}. Expira en ${Math.round(result.expiresIn / 86400)} dias. Anade estas vars a .env.local:\nINSTAGRAM_ACCESS_TOKEN=${result.accessToken}\nINSTAGRAM_ACCOUNT_ID=${result.userId}`,
    });

    // Redirect to dashboard with success
    return NextResponse.redirect(
      new URL(
        `/dashboard?ig_connected=true&ig_account=${result.userId}&ig_expires=${result.expiresIn}`,
        request.url
      )
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    getLogger().error({ message }, "[Instagram OAuth]");

    return NextResponse.redirect(
      new URL(`/dashboard?ig_error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
