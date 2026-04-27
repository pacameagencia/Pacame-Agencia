import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import { getActiveSubscription, daysLeftInTrial } from "@/lib/products/subscriptions";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "AsesorPro · PACAME",
  description: "Panel del asesor fiscal",
  robots: { index: false, follow: false },
  manifest: "/api/asesor-pro-manifest",
  appleWebApp: {
    capable: true,
    title: "AsesorPro",
    statusBarStyle: "black-translucent",
  },
  applicationName: "AsesorPro",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#283B70",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function AsesorProAppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProductUser();
  if (!user) redirect("/p/asesor-pro");

  // Si el user tiene rol client_of, no entra al panel del asesor
  if (user.role === "client_of") redirect("/app/asesor-pro/cliente");

  const subscription = await getActiveSubscription(user.id, "asesor-pro");
  if (!subscription) {
    // Tiene cuenta pero la suscripción está cancelada/expirada
    redirect("/p/asesor-pro?reactivate=1");
  }

  const trialDays = daysLeftInTrial(subscription);

  return (
    <AppShell
      user={{ id: user.id, email: user.email, full_name: user.full_name }}
      subscription={{
        tier: subscription.tier,
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
      }}
      trialDaysLeft={trialDays}
    >
      {children}
    </AppShell>
  );
}
