import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerOrAdmin } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { isValidEmail, isValidPhoneES, isValidNIF } from "@/lib/validators";
import { CreditCard, Bell, MessageSquare, ChevronRight, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

interface SP { saved?: string; error?: string }

export default async function AjustesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireOwnerOrAdmin();
  const sp = await searchParams;

  const supabase = createServerSupabase();
  const { data: dbUser } = await supabase
    .from("pacame_product_users")
    .select("id, email, full_name, phone, metadata")
    .eq("id", user.id)
    .single();

  const meta = (dbUser?.metadata ?? {}) as Record<string, unknown>;
  const fiscal = (meta.fiscal ?? {}) as { nif?: string; address?: string; postal_code?: string; city?: string; brand?: string };

  async function saveSettings(formData: FormData) {
    "use server";
    const me = await requireOwnerOrAdmin();
    const full_name = (formData.get("full_name") as string)?.trim();
    const phone = ((formData.get("phone") as string) ?? "").trim();
    const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
    const nif = ((formData.get("nif") as string) ?? "").trim();
    const address = ((formData.get("address") as string) ?? "").trim();
    const postal_code = ((formData.get("postal_code") as string) ?? "").trim();
    const city = ((formData.get("city") as string) ?? "").trim();
    const brand = ((formData.get("brand") as string) ?? "").trim();

    if (!full_name) redirect("/app/asesor-pro/ajustes?error=name");
    if (email && !isValidEmail(email)) redirect("/app/asesor-pro/ajustes?error=email");
    if (phone && !isValidPhoneES(phone)) redirect("/app/asesor-pro/ajustes?error=phone");
    if (nif && !isValidNIF(nif)) redirect("/app/asesor-pro/ajustes?error=nif");

    const supa = createServerSupabase();
    const { data: cur } = await supa
      .from("pacame_product_users")
      .select("metadata")
      .eq("id", me.id)
      .single();
    const oldMeta = ((cur?.metadata ?? {}) as Record<string, unknown>);
    const newMeta = {
      ...oldMeta,
      fiscal: { nif, address, postal_code, city, brand },
    };
    await supa
      .from("pacame_product_users")
      .update({
        full_name,
        phone: phone || null,
        ...(email ? { email } : {}),
        metadata: newMeta,
      })
      .eq("id", me.id);
    redirect("/app/asesor-pro/ajustes?saved=1");
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          AsesorPro · Ajustes
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          Tu cuenta y tu despacho
        </h1>
      </header>

      {sp.saved && (
        <div className="bg-green-600/10 border border-green-600/30 text-green-700 px-4 py-3 font-sans text-sm">
          Cambios guardados.
        </div>
      )}
      {sp.error && (
        <div className="bg-rose-alert/10 border border-rose-alert/30 text-rose-alert px-4 py-3 font-sans text-sm">
          {sp.error === "nif" && "El NIF/CIF no es válido."}
          {sp.error === "email" && "El email no es válido."}
          {sp.error === "phone" && "El teléfono no es válido."}
          {sp.error === "name" && "Indica tu nombre completo."}
        </div>
      )}

      <form action={saveSettings} className="space-y-8">
        <section className="bg-paper border-2 border-ink/15 p-6">
          <h2 className="font-display text-ink text-lg mb-4" style={{ fontWeight: 500 }}>
            Datos personales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre completo" name="full_name" defaultValue={dbUser?.full_name ?? ""} required />
            <Field label="Email" name="email" type="email" defaultValue={dbUser?.email ?? ""} />
            <Field label="Teléfono" name="phone" defaultValue={dbUser?.phone ?? ""} placeholder="+34 …" />
          </div>
        </section>

        <section className="bg-paper border-2 border-ink/15 p-6">
          <h2 className="font-display text-ink text-lg mb-4" style={{ fontWeight: 500 }}>
            Datos del despacho (aparecerán en tus comunicaciones a clientes)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre comercial" name="brand" defaultValue={fiscal.brand ?? ""} placeholder="Asesoría Calleja" />
            <Field label="NIF / CIF" name="nif" defaultValue={fiscal.nif ?? ""} />
            <Field label="Dirección" name="address" defaultValue={fiscal.address ?? ""} />
            <Field label="Código postal" name="postal_code" defaultValue={fiscal.postal_code ?? ""} />
            <Field label="Ciudad" name="city" defaultValue={fiscal.city ?? ""} />
          </div>
        </section>

        <button
          type="submit"
          className="px-6 py-3 bg-ink text-paper font-sans text-sm hover:bg-terracotta-500 transition-colors"
        >
          Guardar cambios
        </button>
      </form>

      <section className="space-y-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-mute mb-2">Más ajustes</h2>
        <SettingLink href="/app/asesor-pro/ajustes/plan" icon={CreditCard} title="Plan y facturación" hint="Revisa tu suscripción y actualiza el plan." />
        <SettingLink href="/app/asesor-pro/ajustes/recepcionista" icon={Phone} title="Recepcionista IA" hint="Asistente Vapi que coge llamadas en español 24/7." />
        <SettingLink href="/app/asesor-pro/alertas" icon={Bell} title="Notificaciones" hint="Avisos de IVA, clientes inactivos y revisiones." />
        <SettingLink href="/app/asesor-pro/clientes" icon={MessageSquare} title="Clientes y mensajes" hint="Gestiona invitaciones y conversaciones activas." />
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute block mb-1">
        {label} {required && <span className="text-rose-alert">*</span>}
      </span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full bg-paper border border-ink/30 px-3 py-2 text-sm font-sans focus-visible:outline-2 focus-visible:outline-terracotta-500"
      />
    </label>
  );
}

function SettingLink({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  icon: typeof CreditCard;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="bg-paper border-2 border-ink/15 hover:border-ink p-4 flex items-center gap-4 transition-colors"
    >
      <Icon className="w-5 h-5 text-ink-mute" aria-hidden />
      <div className="flex-1">
        <div className="font-display text-ink" style={{ fontWeight: 500 }}>
          {title}
        </div>
        <div className="font-sans text-sm text-ink-mute">{hint}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-ink-mute" aria-hidden />
    </Link>
  );
}
