import { AffiliateDashboard } from "@/lib/modules/referrals/components/AffiliateDashboard";

export const metadata = {
  title: "Programa de afiliados",
};

export default function AffiliatesPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-medium text-ink">Programa de afiliados</h1>
        <p className="mt-1 text-sm text-ink/60">
          Comparte tu enlace y gana 20% durante 12 meses por cada cliente que pague.
        </p>
      </header>
      <AffiliateDashboard />
    </div>
  );
}
