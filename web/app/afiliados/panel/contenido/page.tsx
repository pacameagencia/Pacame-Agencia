import { AffiliateContentLibrary } from "@/lib/modules/referrals/client";

export default function ContenidoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl">Contenido para vender</h2>
        <p className="mt-1 text-sm text-ink/60">
          Plantillas listas: copia, pega, sustituye los placeholders y envía.
          Cada descarga queda registrada para que veamos qué funciona y subamos más.
        </p>
      </div>
      <AffiliateContentLibrary />
    </div>
  );
}
