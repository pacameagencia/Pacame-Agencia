import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Darse de baja · PACAME",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  return (
    <main className="min-h-screen bg-pacame-black flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-dark-card border border-white/[0.06] rounded-2xl p-8 space-y-6">
        <h1 className="font-heading font-bold text-2xl text-pacame-white">
          Te has dado de baja
        </h1>
        <p className="text-pacame-white/70 font-body text-sm leading-relaxed">
          Ya no recibirás comunicaciones comerciales de PACAME. Solo te
          enviaremos mensajes esenciales relacionados con tu cuenta o servicios
          contratados.
        </p>
        <p className="text-pacame-white/50 font-body text-xs leading-relaxed">
          Si prefieres gestionarlo manualmente o quieres volver a suscribirte,
          escríbenos a{" "}
          <a href="mailto:hola@pacameagencia.com" className="text-electric-violet underline">
            hola@pacameagencia.com
          </a>
          .
        </p>
        <div className="pt-4 border-t border-white/[0.06]">
          <a
            href="/"
            className="text-xs text-pacame-white/50 hover:text-pacame-white/80 font-body"
          >
            ← Volver a pacameagencia.com
          </a>
        </div>
      </div>
    </main>
  );
}
