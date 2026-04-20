import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

/**
 * Helpers Supabase para E2E — usan service role key (BYPASSES RLS).
 * CRITICO: nunca correr contra produccion. Solo preview/staging.
 */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let cachedClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error(
      "E2E: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos"
    );
  }
  cachedClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cachedClient;
}

export interface TestClientHandle {
  id: string;
  authToken: string;
  email: string;
}

/**
 * Crea un cliente de test en la tabla `clients` con auth_token valido por 1h.
 * El caller es responsable de llamar deleteTestClient(id) al final del test.
 */
export async function createTestClient(params: {
  email?: string;
  name?: string;
}): Promise<TestClientHandle> {
  const supabase = getServiceClient();
  const email = params.email || `e2e-${randomUUID()}@pacame-test.local`;
  const authToken = `e2e_${randomUUID().replace(/-/g, "")}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      email,
      name: params.name || "E2E Test Client",
      auth_token: authToken,
      auth_token_expires: expiresAt,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      `createTestClient failed: ${error?.message || "no data returned"}`
    );
  }

  return { id: data.id as string, authToken, email };
}

/**
 * Borra cliente + todas las relaciones en cascada.
 * Orden importante: hijos antes que padre para evitar FK constraint errors
 * en caso de que ON DELETE CASCADE no este configurado en alguna tabla.
 */
export async function deleteTestClient(id: string): Promise<void> {
  const supabase = getServiceClient();
  // Tablas hijas primero. Ignoramos errores tabla-no-existe (schema evoluciona).
  const childTables = [
    "deliverables",
    "orders",
    "app_instances",
    "client_messages",
    "client_files",
  ];
  for (const table of childTables) {
    await supabase.from(table).delete().eq("client_id", id);
  }
  await supabase.from("clients").delete().eq("id", id);
}

export async function fetchLatestOrder(clientId: string) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`fetchLatestOrder failed: ${error.message}`);
  return data;
}

/**
 * Crea una order fake directa para un cliente de test.
 * Util para probar lista de orders en /portal/orders sin depender de Stripe.
 */
export async function insertFakeOrder(params: {
  clientId: string;
  serviceSlug?: string;
  orderNumber?: string;
  amountCents?: number;
}) {
  const supabase = getServiceClient();
  const orderNumber =
    params.orderNumber || `E2E-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await supabase
    .from("orders")
    .insert({
      client_id: params.clientId,
      service_slug: params.serviceSlug || "logo-express",
      order_number: orderNumber,
      amount_cents: params.amountCents ?? 4900,
      currency: "eur",
      status: "paid",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`insertFakeOrder failed: ${error?.message || "no data"}`);
  }
  return data;
}

/**
 * Stripe test card estandar.
 * Solo usar con STRIPE_SECRET_KEY en modo test — nunca en LIVE.
 */
export function stripeTestCard() {
  return {
    number: "4242424242424242",
    exp: "12/35",
    cvc: "123",
  };
}
