const steps = [
  {
    number: "01",
    title: "Cuéntanos tu problema",
    description:
      "Agenda una llamada de 30 minutos con Pablo. Sin formularios eternos ni presupuestos ciegos. Escuchamos primero, cotizamos después.",
    color: "#7C3AED",
    icon: "💬",
  },
  {
    number: "02",
    title: "El equipo entra en acción",
    description:
      "Sage diagnostica, Nova diseña, Pixel construye, Atlas posiciona... Cada agente hace lo suyo. En paralelo. A velocidad IA.",
    color: "#06B6D4",
    icon: "⚡",
  },
  {
    number: "03",
    title: "Recibes tu entregable",
    description:
      "Tienes el trabajo en días, no en semanas. Pablo revisa antes de entregarte. Con métricas, con guía de uso, con soporte.",
    color: "#84CC16",
    icon: "✅",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-dark-elevated relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-100" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <p className="font-mono text-neon-cyan text-sm mb-4 uppercase tracking-widest">
            Cómo funciona
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            De problema a solución.
            <br />
            <span className="gradient-text">En tres pasos.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-electric-violet/30 via-neon-cyan/30 to-lime-pulse/30" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative text-center"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Number circle */}
              <div className="relative inline-flex mb-8">
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl"
                  style={{ backgroundColor: `${step.color}15`, border: `1px solid ${step.color}30` }}
                >
                  {step.icon}
                </div>
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-heading"
                  style={{ backgroundColor: step.color, color: "#0D0D0D" }}
                >
                  {step.number}
                </div>
              </div>

              <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
                {step.title}
              </h3>
              <p className="text-pacame-white/60 font-body text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="text-center mt-16">
          <div className="inline-block glass rounded-2xl px-8 py-5">
            <p className="font-heading font-bold text-xl text-pacame-white">
              Lo que una agencia tarda semanas,{" "}
              <span className="gradient-text">nosotros lo entregamos en días.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
