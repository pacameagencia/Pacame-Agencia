/**
 * POST /api/products/[product]/trial
 *
 * Inicia un trial 14 días sin tarjeta para un producto PACAME.
 *
 * Body:
 *   { email, full_name, phone?, password, tier? }
 *
 * Crea (idempotente):
 *   1. pacame_product_users con role='owner'
 *   2. pacame_product_subscriptions con status='trialing'
 *   3. session token + cookie
 *
 * Devuelve redirect URL al panel del producto (ej: /app/asesor-pro).
 */

import { NextRequest, NextResponse } from "next/server";
import { getProduct, findTier, getRecommendedTier } from "@/lib/products/registry";
import { findOrCreateUser, createSession, buildSessionCookie } from "@/lib/products/auth";
import { startTrial } from "@/lib/products/subscriptions";

export const runtime = "nodejs";

interface TrialRequest {
  email: string;
  full_name?: string;
  phone?: string;
  password?: string;
  tier?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ product: string }> }
) {
  const { product: productId } = await params;

  // 1. Validar producto existe + status permite trial
  const product = await getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }
  if (!["live", "beta"].includes(product.status)) {
    return NextResponse.json({ error: "product not available" }, { status: 400 });
  }

  // 2. Parsear body
  let body: TrialRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!body.email || !body.email.includes("@")) {
    return NextResponse.json({ error: "valid email required" }, { status: 400 });
  }
  if (body.password && body.password.length < 8) {
    return NextResponse.json({ error: "password must be 8+ chars" }, { status: 400 });
  }

  // 3. Resolver tier
  const requestedTier = body.tier ? findTier(product, body.tier) : null;
  const tier = requestedTier ?? getRecommendedTier(product);
  if (!tier) {
    return NextResponse.json({ error: "no valid tier in product" }, { status: 500 });
  }

  // 4. Crear/encontrar user
  let user;
  try {
    const result = await findOrCreateUser({
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
      password: body.password,
      role: "owner",
    });
    user = result.user;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // 5. Iniciar trial (idempotente)
  let subscription;
  try {
    const result = await startTrial({
      user_id: user.id,
      product_id: productId,
      tier: tier.tier,
      trial_days: product.trial_days,
    });
    subscription = result.subscription;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // 6. Crear sesión
  const session = await createSession(user.id);
  const cookie = buildSessionCookie(session.token, session.expires);

  const response = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, full_name: user.full_name },
    subscription: {
      id: subscription.id,
      product_id: subscription.product_id,
      tier: subscription.tier,
      status: subscription.status,
      trial_ends_at: subscription.trial_ends_at,
    },
    redirect: `/app/${productId}`,
  });
  response.headers.set("Set-Cookie", cookie);
  return response;
}
