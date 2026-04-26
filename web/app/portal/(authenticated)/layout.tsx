import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import PortalSidebar from "@/components/portal/PortalSidebar";
import { ToastProvider } from "@/components/ui/toast";

async function getAuthClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .single();
  return data;
}

export default async function PortalAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = await getAuthClient();

  if (!client) {
    redirect("/portal");
  }

  const supabase = createServerSupabase();

  // Fetch brand settings
  const { data: brandSettings } = await supabase
    .from("client_brand_settings")
    .select("*")
    .eq("client_id", client.id)
    .single();

  // Fetch unread message count
  const { count: unreadCount } = await supabase
    .from("client_messages")
    .select("*", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("read", false)
    .neq("sender", "client");

  const primaryColor = brandSettings?.primary_color ?? "#B54E30";
  const secondaryColor = brandSettings?.secondary_color ?? "#283B70";
  const logoUrl = brandSettings?.logo_url ?? null;
  const clientName = client.business_name || client.name || "Cliente";

  return (
    <div
      className="min-h-screen bg-paper"
      style={
        {
          "--client-primary": primaryColor,
          "--client-secondary": secondaryColor,
        } as React.CSSProperties
      }
    >
      <ToastProvider>
        <PortalSidebar
          clientName={clientName}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          unreadCount={unreadCount ?? 0}
        />

        {/* Main content area */}
        <main className="lg:pl-64 min-h-screen">
          {/* Mobile top bar spacing */}
          <div className="h-14 lg:hidden" />
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </ToastProvider>
    </div>
  );
}
