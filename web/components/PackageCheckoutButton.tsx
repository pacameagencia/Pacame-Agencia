"use client";

import Link from "next/link";
import CheckoutButton from "@/components/CheckoutButton";

const packagePrices: Record<string, { amount: number; description: string }> = {
  despega: { amount: 1800, description: "Paquete Despega — Presencia digital desde cero" },
  escala: { amount: 3500, description: "Paquete Escala — Crecimiento digital completo" },
  domina: { amount: 8000, description: "Paquete Domina — Transformacion digital total" },
};

interface Props {
  packageId: string;
  packageName: string;
  featured?: boolean;
}

export default function PackageCheckoutButton({ packageId, packageName, featured }: Props) {
  const pricing = packagePrices[packageId];
  if (!pricing) return null;

  return (
    <div>
      <CheckoutButton
        product="custom"
        amount={pricing.amount}
        label={`Empezar desde ${pricing.amount.toLocaleString("es-ES")}\u00A0\u20AC`}
        description={pricing.description}
        variant={featured ? "secondary" : "outline"}
        size="lg"
        className={`w-full ${featured ? "bg-white text-pacame-black hover:bg-white/90" : ""}`}
      />
      <Link
        href="/contacto"
        className={`block text-center text-xs font-body mt-3 transition-colors ${
          featured ? "text-white/40 hover:text-white/60" : "text-pacame-white/30 hover:text-pacame-white/50"
        }`}
      >
        o hablar primero sin compromiso
      </Link>
      <p className="text-center text-[10px] text-pacame-white/20 font-body mt-2">
        Pago seguro via Stripe &middot; Cancela cuando quieras
      </p>
    </div>
  );
}
