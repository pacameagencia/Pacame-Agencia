import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import PrivacyActions from "@/components/portal/PrivacyActions";
import { ShieldCheck, Download, Trash2, Info } from "lucide-react";

async function getClient() {
  const token = (await cookies()).get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("id, email, name, deletion_requested_at, deletion_confirmed_at, deletion_completed_at")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .maybeSingle();
  return data;
}

export default async function PrivacyPage() {
  const client = await getClient();
  if (!client) redirect("/portal");

  const supabase = createServerSupabase();
  const { data: exports } = await supabase
    .from("gdpr_export_requests")
    .select("id, status, file_url, file_size_bytes, requested_at, completed_at, expires_at")
    .eq("client_id", client.id)
    .order("requested_at", { ascending: false })
    .limit(10);

  const deletionStatus = client.deletion_confirmed_at
    ? "confirmed"
    : client.deletion_requested_at
      ? "awaiting_confirmation"
      : null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-olympus-gold" />
          Privacidad y datos
        </h1>
        <p className="text-pacame-white/60 font-body text-sm">
          Tu derecho a acceder, descargar y eliminar tus datos personales (RGPD).
        </p>
      </header>

      {/* Export */}
      <section className="rounded-2xl p-6 bg-dark-card border border-white/[0.06]">
        <div className="flex items-start gap-3 mb-4">
          <Download className="w-5 h-5 text-olympus-gold mt-1 flex-shrink-0" />
          <div>
            <h2 className="font-heading font-semibold text-xl text-pacame-white mb-1">
              Descargar mis datos
            </h2>
            <p className="text-pacame-white/60 font-body text-sm">
              Te generamos un ZIP con TODO: perfil, pedidos, entregables, mensajes, suscripciones.
              Tarda ~1-2 min. Disponible 24h.
            </p>
          </div>
        </div>

        <PrivacyActions
          clientEmail={client.email as string}
          initialExports={(exports || []) as Array<Record<string, unknown>>}
          initialDeletionStatus={deletionStatus}
        />
      </section>

      {/* Delete */}
      <section className="rounded-2xl p-6 bg-red-500/5 border border-red-500/20">
        <div className="flex items-start gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
          <div>
            <h2 className="font-heading font-semibold text-xl text-pacame-white mb-1">
              Eliminar mi cuenta
            </h2>
            <p className="text-pacame-white/60 font-body text-sm leading-relaxed">
              Proceso de 2 pasos: (1) confirmas via email, (2) pasamos 30 dias de reflexion
              antes de purgar. Puedes cancelar en cualquier momento hasta el dia 30.
            </p>
          </div>
        </div>
      </section>

      <aside className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.04] flex items-start gap-3 text-sm">
        <Info className="w-4 h-4 text-pacame-white/40 mt-0.5 flex-shrink-0" />
        <p className="text-pacame-white/60 font-body">
          Responsable de tratamiento: PACAME Agencia. Base legal: ejecucion del contrato +
          consentimiento. Contacto DPO:{" "}
          <a href="mailto:hola@pacameagencia.com" className="text-olympus-gold underline">
            hola@pacameagencia.com
          </a>
          .
        </p>
      </aside>
    </div>
  );
}
