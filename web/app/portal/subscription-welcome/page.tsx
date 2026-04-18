import Link from "next/link";
import { Crown, ArrowRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SubscriptionWelcomePage() {
  return (
    <div className="min-h-screen bg-pacame-black text-pacame-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-olympus-gold/10 border border-olympus-gold/30 mb-6">
          <Crown className="w-8 h-8 text-olympus-gold" />
        </div>
        <h1 className="font-heading font-bold text-3xl md:text-4xl mb-3">
          Bienvenido a tu nuevo plan PACAME
        </h1>
        <p className="text-pacame-white/60 font-body mb-8">
          Tu suscripcion esta activa. Hemos enviado las credenciales de acceso
          al email de la compra. Si ya tienes cuenta, entra directamente al portal.
        </p>

        <ul className="text-left space-y-2 mb-8 max-w-md mx-auto">
          <li className="flex items-start gap-2 text-sm font-body text-pacame-white/70">
            <CheckCircle2 className="w-4 h-4 text-olympus-gold mt-0.5 flex-shrink-0" />
            Suscripcion activada y cobro procesado.
          </li>
          <li className="flex items-start gap-2 text-sm font-body text-pacame-white/70">
            <CheckCircle2 className="w-4 h-4 text-olympus-gold mt-0.5 flex-shrink-0" />
            Apps incluidas listas para configurar.
          </li>
          <li className="flex items-start gap-2 text-sm font-body text-pacame-white/70">
            <CheckCircle2 className="w-4 h-4 text-olympus-gold mt-0.5 flex-shrink-0" />
            Acceso inmediato al portal de cliente.
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/portal/subscription"
            className="inline-flex items-center justify-center gap-2 bg-olympus-gold hover:bg-olympus-gold/90 text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl transition"
          >
            Ir a mi suscripcion
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-pacame-white font-heading font-medium px-6 py-3 rounded-xl transition"
          >
            Iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
