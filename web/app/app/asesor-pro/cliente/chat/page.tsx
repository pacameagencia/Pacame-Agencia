import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";
import { createServerSupabase } from "@/lib/supabase/server";
import ChatThread from "@/components/products/asesor-pro/ChatThread";

export const dynamic = "force-dynamic";

export default async function ChatClientePage() {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") redirect("/p/asesor-pro");
  const ctx = await getClientContext(user);
  if (!ctx) redirect("/p/asesor-pro");

  const supabase = createServerSupabase();
  const { data: asesor } = await supabase
    .from("pacame_product_users")
    .select("full_name, email")
    .eq("id", ctx.asesor_user_id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">Chat con tu asesor</span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          {asesor?.full_name ?? "Tu asesor"}
        </h1>
      </div>

      <ChatThread
        asesorClientId={ctx.asesor_client_id}
        currentUserId={user.id}
        counterpartName={asesor?.full_name ?? "Tu asesor"}
        counterpartSubtitle={asesor?.email ? `${asesor.email} · sin emails fuera del sistema` : undefined}
      />
    </div>
  );
}
