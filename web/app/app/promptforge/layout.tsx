import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentProductUser } from "@/lib/products/session";
import { getActiveSubscription, daysLeftInTrial } from "@/lib/products/subscriptions";
import PromptForgeShell from "./PromptForgeShell";

export const metadata: Metadata = {
  title: "PromptForge · PACAME",
  robots: { index: false, follow: false },
};

export default async function PromptForgeLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProductUser();
  if (!user) redirect("/p/promptforge");

  const subscription = await getActiveSubscription(user.id, "promptforge");
  if (!subscription) redirect("/p/promptforge?reactivate=1");

  return (
    <PromptForgeShell
      user={{ id: user.id, email: user.email, full_name: user.full_name }}
      subscription={{
        tier: subscription.tier,
        status: subscription.status,
        trial_ends_at: subscription.trial_ends_at,
      }}
      trialDaysLeft={daysLeftInTrial(subscription)}
    >
      {children}
    </PromptForgeShell>
  );
}
