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
    <main className="min-h-screen bg-paper flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full bg-paper-deep border border-ink/[0.06] rounded-2xl p-8 space-y-6">
        <h1 className="font-heading font-bold text-2xl text-ink">
          Te has dado de baja
        </h1>
        <p className="text-ink/70 font-body text-sm leading-relaxed">
          Ya no recibirás comunicaciones comerciales de PACAME. Solo te
          enviaremos mensajes esenciales relacionados con tu cuenta o servicios
          contratados.
        </p>
        <p className="text-ink/50 font-body text-xs leading-relaxed">
          Si prefieres gestionarlo manualmente o quieres volver a suscribirte,
          escríbenos a{" "}
          <a href="mailto:hola@pacameagencia.com" className="text-brand-primary underline">
            hola@pacameagencia.com
          </a>
          .
        </p>
        <div className="pt-4 border-t border-ink/[0.06]">
          <a
            href="/"
            className="text-xs text-ink/50 hover:text-ink/80 font-body"
          >
            ← Volver a pacameagencia.com
          </a>
        </div>
      </div>
    </main>
  );
}
