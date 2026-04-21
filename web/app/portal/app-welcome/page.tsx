import Link from "next/link";
import { Boxes, ArrowRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app } = await searchParams;
  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-gold/10 border border-accent-gold/30 mb-6">
          <Boxes className="w-8 h-8 text-accent-gold" />
        </div>
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-3">
          Tu app esta casi lista
        </h1>
        <p className="text-ink/60 font-body mb-8">
          {app ? `Has activado ${app}.` : "Has activado tu app."} Solo falta
          un paso: rellenar el setup (60 segundos). Hemos enviado el enlace
          directo a tu email.
        </p>

        <ul className="text-left space-y-2 mb-8 max-w-md mx-auto">
          <li className="flex items-start gap-2 text-sm font-body text-ink/70">
            <CheckCircle2 className="w-4 h-4 text-accent-gold mt-0.5 flex-shrink-0" />
            Pago procesado.
          </li>
          <li className="flex items-start gap-2 text-sm font-body text-ink/70">
            <CheckCircle2 className="w-4 h-4 text-accent-gold mt-0.5 flex-shrink-0" />
            App provisionada en tu cuenta.
          </li>
          <li className="flex items-start gap-2 text-sm font-body text-ink/70">
            <CheckCircle2 className="w-4 h-4 text-accent-gold mt-0.5 flex-shrink-0" />
            Accede al portal para completar la configuracion.
          </li>
        </ul>

        <Link
          href="/portal/apps"
          className="inline-flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-gold/90 text-ink font-heading font-semibold px-6 py-3 rounded-xl transition"
        >
          Configurar mi app
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
