import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Martínez",
    role: "Constructor · Madrid",
    text: "En 3 días tenía una web corporativa que ninguna agencia me había podido hacer en 2 meses. El precio fue la mitad. Sigo sin creerlo.",
    rating: 5,
    service: "Web Corporativa",
    color: "#7C3AED",
    initials: "CM",
  },
  {
    name: "Laura Fernández",
    role: "Emprendedora · Barcelona",
    text: "Lancé mi negocio con PACAME. Web, logo, redes y Google Ads en menos de dos semanas. Ya tengo mis primeros clientes. Gracias al equipo.",
    rating: 5,
    service: "Paquete Despega",
    color: "#06B6D4",
    initials: "LF",
  },
  {
    name: "Miguel Torres",
    role: "E-commerce · Valencia",
    text: "El SEO que hacía Atlas empieza a dar frutos. En 3 meses, +180% de tráfico orgánico. La facturación online se ha triplicado.",
    rating: 5,
    service: "SEO Premium",
    color: "#2563EB",
    initials: "MT",
  },
  {
    name: "Ana García",
    role: "Boutique Online · Sevilla",
    text: "Nexus montó mis Meta Ads y en la primera semana ya había recuperado la inversión. El embudo funciona solo. No paro de recibir pedidos.",
    rating: 5,
    service: "Meta Ads + Embudo",
    color: "#EA580C",
    initials: "AG",
  },
  {
    name: "Roberto Sánchez",
    role: "Consultor · Bilbao",
    text: "Necesitaba rebranding completo para relanzar mi marca. Nova lo entendió en la primera llamada. El resultado superó todo lo que imaginé.",
    rating: 5,
    service: "Branding Completo",
    color: "#EC4899",
    initials: "RS",
  },
  {
    name: "Isabel López",
    role: "Clínica · Málaga",
    text: "Pulse gestiona nuestras redes desde hace 4 meses. El engagement se ha multiplicado por 5 y tenemos lista de espera de nuevos pacientes.",
    rating: 5,
    service: "Plan Growth Social",
    color: "#D97706",
    initials: "IL",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="section-padding bg-dark-elevated relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-electric-violet/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Resultados reales
          </p>
          <h2 className="font-heading font-bold text-section text-pacame-white mb-6">
            El trabajo habla.
            <br />
            <span className="gradient-text">Los clientes también.</span>
          </h2>
          <p className="text-sm text-pacame-white/40 font-body">
            Testimonios de clientes reales. Próximamente, con sus webs como prueba.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={t.name}
              className="relative rounded-2xl p-6 bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* Quote icon */}
              <div className="absolute top-5 right-5 opacity-10">
                <Quote className="w-8 h-8 text-electric-violet" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-signal text-amber-signal" />
                ))}
              </div>

              {/* Text */}
              <p className="text-pacame-white/80 font-body text-sm leading-relaxed mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-sm"
                  style={{ backgroundColor: `${t.color}20`, color: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-heading font-semibold text-pacame-white">
                    {t.name}
                  </div>
                  <div className="text-xs text-pacame-white/40 font-body">{t.role}</div>
                </div>
                <div className="ml-auto">
                  <span
                    className="text-[10px] px-2 py-1 rounded-full font-body"
                    style={{
                      backgroundColor: `${t.color}15`,
                      color: t.color,
                      border: `1px solid ${t.color}25`,
                    }}
                  >
                    {t.service}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
