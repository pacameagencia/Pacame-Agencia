import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Zap } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import DynamicInputForm from "@/components/order/DynamicInputForm";

async function getClient() {
  const token = (await cookies()).get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle();
  return data;
}

export default async function OrderFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient();
  if (!client) redirect(`/portal?redirect=/portal/orders/${id}/form`);

  const supabase = createServerSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, client_id, service_slug, status, inputs")
    .eq("id", id)
    .maybeSingle();

  if (!order) notFound();
  if (order.client_id !== client.id) redirect("/portal/orders");

  // If inputs already submitted, go to tracking view
  if (order.status !== "inputs_pending" && order.status !== "paid") {
    redirect(`/portal/orders/${id}`);
  }

  const { data: catalog } = await supabase
    .from("service_catalog")
    .select("slug, name, tagline, delivery_sla_hours, inputs_schema")
    .eq("slug", order.service_slug)
    .maybeSingle();

  if (!catalog) {
    // Fallback — allow empty submission
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-ink">
          Servicio no encontrado. Ya hemos avisado a Pablo para que te atienda personalmente.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/portal/orders"
        className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink/80 font-body mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Mis pedidos
      </Link>

      <div className="mb-6 flex items-center gap-2 text-xs font-body font-semibold text-accent-gold uppercase tracking-wider bg-accent-gold/10 rounded-full px-3 py-1 border border-accent-gold/20 w-fit">
        <Zap className="w-3 h-3" />
        Paso final — {catalog.delivery_sla_hours}h hasta tu entregable
      </div>

      <h1 className="font-heading font-bold text-3xl text-ink mb-2">
        {catalog.name}
      </h1>
      <p className="text-ink/60 font-body mb-8">
        {catalog.tagline}. Cuentanos los detalles y arrancamos.
      </p>

      <div className="rounded-2xl p-6 sm:p-8 bg-paper-deep border border-ink/[0.06]">
        <div className="mb-6 flex items-center gap-2 text-sm font-body text-ink/70">
          <Sparkles className="w-4 h-4 text-accent-gold" />
          <span>
            Este formulario tarda 60 segundos. El agente empieza justo despues.
          </span>
        </div>

        <DynamicInputForm
          orderId={id}
          schema={
            (catalog.inputs_schema as {
              type: string;
              required?: string[];
              properties?: Record<
                string,
                {
                  type: string;
                  title?: string;
                  enum?: string[];
                  items?: { type: string; enum?: string[] };
                  minItems?: number;
                  maxItems?: number;
                  minLength?: number;
                  maxLength?: number;
                  pattern?: string;
                  format?: string;
                  default?: unknown;
                }
              >;
            }) || { type: "object" }
          }
          defaults={(order.inputs as Record<string, unknown>) || {}}
        />
      </div>
    </div>
  );
}
