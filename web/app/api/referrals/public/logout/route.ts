import { NextResponse } from "next/server";
import { clearAffiliateCookie } from "@/lib/modules/referrals/affiliate-auth";

export async function POST() {
  return clearAffiliateCookie(NextResponse.json({ ok: true }));
}
