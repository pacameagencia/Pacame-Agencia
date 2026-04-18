"use client";

import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";
import ProductEditor from "@/components/catalog/ProductEditor";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/catalog/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) setProduct(d.product);
        else setError(d.error || "Producto no encontrado");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  if (!product) {
    return (
      <div className="p-6 flex items-center gap-2 text-white/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando...
      </div>
    );
  }

  return (
    <ProductEditor
      initial={{
        id: product.id as string,
        slug: (product.slug as string) || "",
        name: (product.name as string) || "",
        tagline: (product.tagline as string) || "",
        description: (product.description as string) || "",
        price_cents: (product.price_cents as number) || 0,
        agent_id: (product.agent_id as string) || "nova",
        delivery_sla_hours: (product.delivery_sla_hours as number) || 24,
        deliverable_kind: (product.deliverable_kind as string) || "text",
        revisions_included: (product.revisions_included as number) ?? 2,
        inputs_schema: (product.inputs_schema as Record<string, unknown>) || {},
        features: (product.features as string[]) || [],
        faq: (product.faq as { q: string; a: string }[]) || [],
        category: (product.category as string) || "",
        tags: (product.tags as string[]) || [],
        runner_type: (product.runner_type as string) || "custom",
        runner_config: (product.runner_config as Record<string, unknown>) || {},
        product_type: (product.product_type as string) || "one_off",
        is_active: !!product.is_active,
        is_featured: !!product.is_featured,
        sort_order: (product.sort_order as number) ?? 100,
      }}
    />
  );
}
