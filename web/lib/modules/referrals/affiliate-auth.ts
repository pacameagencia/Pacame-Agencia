import crypto from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const AFF_AUTH_COOKIE = "pacame_aff_auth";
const COOKIE_TTL_SEC = 30 * 24 * 60 * 60;

export type AffiliateSession = {
  affiliate_id: string;
  email: string;
  iat: number; // issued at (ms)
};

function authSecret(): string {
  return (
    process.env.AFFILIATE_AUTH_SECRET ||
    process.env.DASHBOARD_AUTH_SECRET ||
    process.env.CRON_SECRET ||
    "dev-secret-change-in-production"
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", authSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export function makeAffiliateToken(session: Omit<AffiliateSession, "iat">): string {
  const payload: AffiliateSession = { ...session, iat: Date.now() };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf8").toString("base64url");
  const sig = sign(b64);
  return `${b64}.${sig}`;
}

export function verifyAffiliateToken(token: string | undefined): AffiliateSession | null {
  if (!token) return null;
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;
  if (!safeEqual(sign(b64), sig)) return null;
  try {
    const json = Buffer.from(b64, "base64url").toString("utf8");
    const session = JSON.parse(json) as AffiliateSession;
    if (!session.affiliate_id || !session.email || !session.iat) return null;
    if (Date.now() - session.iat > COOKIE_TTL_SEC * 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export function readAffiliateSessionFromRequest(request: Request): AffiliateSession | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  const match = header
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${AFF_AUTH_COOKIE}=`));
  if (!match) return null;
  return verifyAffiliateToken(decodeURIComponent(match.split("=").slice(1).join("=")));
}

export function writeAffiliateCookie(response: NextResponse, session: Omit<AffiliateSession, "iat">): NextResponse {
  response.cookies.set(AFF_AUTH_COOKIE, makeAffiliateToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_TTL_SEC,
    path: "/",
  });
  return response;
}

export function clearAffiliateCookie(response: NextResponse): NextResponse {
  response.cookies.set(AFF_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isStrongEnough(password: string): boolean {
  return password.length >= 8;
}
