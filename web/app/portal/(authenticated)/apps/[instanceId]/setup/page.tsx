import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import AppSetupForm from "@/components/app/AppSetupForm";
import { Boxes, CheckCircle2, ArrowLeft } from "lucide-react";

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

interface Params {
  instanceId: string;
}

export default async function AppSetupPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const client = await getClient();
  if (!client) redirect("/portal");

  const { instanceId } = await params;

  const supabase = createServerSupabase();
  const { data: instance } = await supabase
    .from("app_instances")
    .select("id, client_id, app_slug, app_id, status, config")
    .eq("id", instanceId)
    .maybeSingle();

  if (!instance || instance.client_id !== client.id) {
    redirect("/portal/apps");
  }

  const { data: app } = await supabase
    .from("apps_catalog")
    .select("slug, name, tagline, config_schema")
    .eq("id", instance.app_id)
    .maybeSingle();

  if (!app) redirect("/portal/apps");

  // Si ya esta activa, mostrar edicion (misma UI)
  const schema = (app.config_schema || {}) as {
    type?: string;
    required?: string[];
    properties?: Record<string, {
      type: string;
      title?: string;
      enum?: string[];
      items?: { type: string; enum?: string[] };
      maxLength?: number;
    }>;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/portal/apps"
          className="inline-flex items-center gap-1.5 text-sm font-body text-ink/50 hover:text-ink transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Mis apps
        </Link>
        <h1 className="font-heading font-bold text-3xl text-ink mb-1 flex items-center gap-3">
          <Boxes className="w-7 h-7 text-accent-gold" />
          Configura {app.name}
        </h1>
        <p className="text-ink/60 font-body text-sm">
          {instance.status === "active"
            ? "Edita la configuracion de tu app en cualquier momento."
            : "Rellena estos datos para activar tu app."}
        </p>
      </div>

      {instance.status === "active" && (
        <div className="flex items-center gap-2 p-4 mb-6 rounded-xl bg-green-400/10 border border-green-400/30 text-green-400 font-body text-sm">
          <CheckCircle2 className="w-5 h-5" />
          Esta app ya esta activa. Puedes editar su configuracion abajo.
        </div>
      )}

      <AppSetupForm
        instanceId={instanceId}
        schema={schema}
        initialConfig={(instance.config || {}) as Record<string, unknown>}
      />
    </div>
  );
}
