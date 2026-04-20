import type { Metadata } from "next";
import RefiereClient from "@/components/refiere/RefiereClient";

export const metadata: Metadata = {
  title: "Refiere a PACAME — Gana 15% de comision",
  description:
    "Invita a otra empresa a PACAME. Ella se lleva 10% de descuento. Tu te llevas 15% de cada euro que facture, cada mes. Sin tope.",
  openGraph: {
    title: "Refiere PACAME — Gana 15% de cada cliente que traigas",
    description:
      "Cliente nuevo entra con -10%. Tu cobras 15% de comision, para siempre.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://pacameagencia.com/refiere" },
};

export default function RefierePage() {
  return (
    <main className="min-h-screen bg-pacame-black pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-olympus-gold/10 border border-olympus-gold/30 text-[11px] text-olympus-gold font-mono uppercase tracking-wider">
            Programa de referidos · Clientes
          </div>
          <h1 className="font-heading font-bold text-5xl md:text-6xl text-pacame-white leading-tight mb-5">
            Gana dinero<br />
            <span className="bg-gradient-to-r from-olympus-gold to-amber-400 bg-clip-text text-transparent">
              refiriendo a PACAME
            </span>
          </h1>
          <p className="text-pacame-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Tu amigo entra con un <strong className="text-pacame-white">10% de descuento</strong>.
            Tu te llevas el <strong className="text-olympus-gold">15% de comision</strong> de
            cada euro que facture, cada mes. Sin tope.
          </p>
        </div>

        {/* Como funciona */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {[
            {
              n: "1",
              t: "Consigue tu codigo",
              d: "Pon tu email (el mismo con el que compraste) abajo. Te damos tu codigo unico.",
            },
            {
              n: "2",
              t: "Comparte",
              d: "Envia tu link a clientes potenciales. WhatsApp, email, LinkedIn — donde quieras.",
            },
            {
              n: "3",
              t: "Cobra cada mes",
              d: "Cada euro que facturen, el 15% es tuyo. Pago mensual via transferencia.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="p-6 rounded-2xl bg-dark-card border border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-xl bg-olympus-gold/10 border border-olympus-gold/30 flex items-center justify-center text-olympus-gold font-heading font-bold text-lg mb-4">
                {step.n}
              </div>
              <div className="font-heading font-semibold text-pacame-white text-lg mb-2">
                {step.t}
              </div>
              <p className="text-sm text-pacame-white/60 leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>

        {/* Client */}
        <RefiereClient />

        {/* FAQ */}
        <div className="mt-14 max-w-3xl mx-auto">
          <h2 className="font-heading font-bold text-2xl text-pacame-white mb-6 text-center">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "¿Quien puede usar el programa?",
                a: "Cualquier cliente PACAME con al menos 1 pedido confirmado. Por eso te pedimos el email con el que compraste — es la prueba de que eres cliente real.",
              },
              {
                q: "¿Durante cuanto tiempo cobro comisiones?",
                a: "Mientras el referido siga activo. Si paga suscripcion mensual, cobras cada mes. Si compra servicios puntuales, cobras en cada compra. Sin tope de tiempo.",
              },
              {
                q: "¿Cuando se paga la comision?",
                a: "Los dias 1-5 de cada mes te transferimos todo lo acumulado del mes anterior (minimo 20€). Si el referido cancela en los primeros 14 dias, la comision de esa compra se anula.",
              },
              {
                q: "¿Puedo compartir el codigo en publico (blog, redes)?",
                a: "Si, completamente libre. Solo pedimos que no se use para auto-referirte ni spam masivo — lo detectamos y se bloquea la cuenta.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-dark-card border border-white/[0.06]"
              >
                <div className="font-heading font-semibold text-pacame-white mb-2">
                  {f.q}
                </div>
                <div className="text-sm text-pacame-white/60 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
