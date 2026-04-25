import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { REF_COOKIE_NAME } from "./config";

export type RefCookieValue = {
  v: string;        // visitor uuid
  c: string;        // referral_code
  a: string;        // affiliate_id
  t: number;        // created_at ms
};

export async function readRefCookie(): Promise<RefCookieValue | null> {
  const store = await cookies();
  const raw = store.get(REF_COOKIE_NAME)?.value;
  return parseRefCookie(raw);
}

export function readRefCookieFromRequest(req: Request): RefCookieValue | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REF_COOKIE_NAME}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.split("=").slice(1).join("="));
  return parseRefCookie(raw);
}

export function writeRefCookieOnResponse(
  response: NextResponse,
  value: RefCookieValue,
  days: number,
): NextResponse {
  response.cookies.set(REF_COOKIE_NAME, JSON.stringify(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: days * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export function clearRefCookieOnResponse(response: NextResponse): NextResponse {
  response.cookies.set(REF_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}

function parseRefCookie(raw: string | undefined): RefCookieValue | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RefCookieValue;
    if (!parsed?.v || !parsed?.c || !parsed?.a) return null;
    return parsed;
  } catch {
    return null;
  }
}
