import Link from "next/link";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { Phone, ArrowLeft, ExternalLink } from "lucide-react";
import { ReceptionistForm } from "./ReceptionistForm";
import { CallsList } from "./CallsList";

export const dynamic = "force-dynamic";

export default async function RecepcionistaPage() {
  const user = await requireOwnerOrAdmin();
  const supabase = createServerSupabase();

  const [{ data: settings }, { data: calls }] = await Promise.all([
    supabase
      .from("asesorpro_settings")
      .select("vapi_assistant_id, vapi_first_message, business_hours, vapi_enabled, vapi_phone_number_id")
      .eq("asesor_user_id", user.id)
      .maybeSingle(),
    supabase
      .from("asesorpro_vapi_calls")
      .select("id, vapi_call_id, caller_phone, caller_name, summary, transcript, duration_seconds, status, ended_reason, created_at")
      .eq("asesor_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const meta = (user.full_name ?? user.email).split("@")[0];
  const initialBrand = `Asesoría ${meta}`;

  return (
    <div className="space-y-8 max-w-4xl">
      <Link
        href="/app/asesor-pro/ajustes"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="w-3 h-3" /> Volver a ajustes
      </Link>

      <header>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          AsesorPro · Recepcionista IA
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          Tu asistente que contesta en español
        </h1>
        <p className="font-sans text-ink-mute mt-2 max-w-2xl">
          Crea un asistente de Vapi que coge llamadas en tu nombre, identifica al cliente, recoge motivos
          y te avisa por Telegram. Funciona 24/7 con voz humana en español.
        </p>
      </header>

      <ReceptionistForm
        initial={{
          assistant_id: settings?.vapi_assistant_id ?? null,
          first_message: settings?.vapi_first_message ?? null,
          business_hours: settings?.business_hours ?? null,
          enabled: settings?.vapi_enabled ?? false,
          brand: initialBrand,
        }}
      />

      <section className="bg-paper border-2 border-ink/15 p-6">
        <h2 className="font-display text-ink text-lg mb-4 flex items-center gap-2" style={{ fontWeight: 500 }}>
          <Phone className="w-4 h-4" /> Últimas llamadas
        </h2>
        <CallsList calls={(calls ?? []) as Parameters<typeof CallsList>[0]["calls"]} />
        {settings?.vapi_assistant_id && (
          <a
            href={`https://dashboard.vapi.ai/assistants/${settings.vapi_assistant_id}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.15em] text-terracotta-500 hover:text-terracotta-600"
          >
            Abrir en Vapi <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </section>
    </div>
  );
}
