import type { Metadata } from "next";
import NpsForm from "@/components/nps/NpsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Encuesta NPS — PACAME",
  description: "Cuentanos como ha ido. 30 segundos.",
  robots: { index: false, follow: false },
};

export default async function NpsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-pacame-black flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <NpsForm token={token} />
      </div>
    </main>
  );
}
