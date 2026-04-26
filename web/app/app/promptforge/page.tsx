import { requireProductUser } from "@/lib/products/session";
import { getActiveSubscription } from "@/lib/products/subscriptions";
import { getProduct, findTier } from "@/lib/products/registry";
import { redirect } from "next/navigation";
import ForgeClient from "./ForgeClient";

export const dynamic = "force-dynamic";

export default async function ForgePage() {
  const user = await requireProductUser("/p/promptforge");
  const sub = await getActiveSubscription(user.id, "promptforge");
  if (!sub) redirect("/p/promptforge?reactivate=1");

  const product = await getProduct("promptforge");
  const tier = product ? findTier(product, sub.tier) : null;

  return (
    <ForgeClient
      tierKey={sub.tier}
      videoEnabled={!!tier?.limits.video_targets}
      maxVariants={(tier?.limits.variants_per_prompt as number) ?? 2}
    />
  );
}
