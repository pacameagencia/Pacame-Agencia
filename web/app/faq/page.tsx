import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import FaqAccordion from "@/components/FaqAccordion";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes sobre PACAME — Precios, Plazos, Garantías",
  description:
    "Resolvemos tus dudas sobre PACAME: precios, plazos, proceso de trabajo, agentes IA, garantías y más. Todo lo que necesitas saber antes de contratar.",
  alternates: { canonical: "https://pacameagencia.com/faq" },
  openGraph: {
    title: "Preguntas Frecuentes — PACAME Agencia Digital",
    description: "Precios, plazos, garantías y proceso de trabajo. Resolvemos todas tus dudas.",
    url: "https://pacameagencia.com/faq",
    siteName: "PACAME",
    type: "website",
    locale: "es_ES",
  },
};

const faqCategories = [
  {
    title: "Sobre PACAME",
    color: "#7C3AED",
    items: [
      {
        question: "Que es PACAME exactamente?",
        answer:
          "PACAME es una agencia digital formada por 7 agentes IA especializados, liderados por Pablo Calleja. Cada agente domina un area: branding, SEO, desarrollo web, publicidad, redes sociales, estrategia y backend. Es como tener un departamento de marketing completo, pero mas rapido y a una fraccion del coste.",
      },
      {
        question: "Son agentes IA de verdad? Como funciona?",
        answer:
          "Si. Cada agente es una inteligencia artificial especializada con un rol, personalidad y conocimientos propios. Nova disena, Atlas posiciona en Google, Pixel construye webs, Nexus gestiona publicidad... Pero no es un robot sin control: Pablo supervisa cada entrega, toma decisiones estrategicas y es tu punto de contacto humano.",
      },
      {
        question: "Por que deberia confiar en una agencia con IA?",
        answer:
          "Porque los resultados hablan. La IA nos permite ser mas rapidos y baratos, pero la calidad la garantiza la supervision humana de Pablo en cada proyecto. Ademas, todos nuestros precios, procesos y plazos son publicos y transparentes. Si no estas satisfecho, te devolvemos el dinero.",
      },
      {
        question: "Sois solo un chatbot que genera cosas automaticas?",
        answer:
          "No. Un chatbot responde preguntas genericas. Nuestros agentes IA ejecutan proyectos completos: investigan tu sector, disenan estrategias personalizadas, construyen webs, redactan contenido y optimizan campanas. Todo supervisado por un humano. El resultado es indistinguible del de una agencia tradicional, pero en menos tiempo.",
      },
    ],
  },
  {
    title: "Precios y pagos",
    color: "#06B6D4",
    items: [
      {
        question: "Cuanto cuesta una pagina web?",
        answer:
          "Depende del tipo: una landing page desde 300 EUR (2-3 dias), una web corporativa de 3-5 paginas desde 800 EUR (5-7 dias), un e-commerce desde 2.000 EUR (10-15 dias). Todos los precios estan en nuestra pagina de servicios, sin sorpresas.",
      },
      {
        question: "Hay costes ocultos?",
        answer:
          "No. El precio que ves es el precio que pagas. Incluye diseno, desarrollo, copywriting, SEO basico y hosting del primer ano. Solo se cobra aparte si pides cambios fuera del alcance acordado, y siempre te avisamos antes.",
      },
      {
        question: "Como se paga?",
        answer:
          "Proyectos: 50% al inicio, 50% a la entrega. Servicios recurrentes (SEO, redes, ads): pago mensual por Stripe o transferencia. Paquetes combinados: posibilidad de fraccionamiento en 2-3 pagos. Aceptamos tarjeta, transferencia y Bizum.",
      },
      {
        question: "Ofreceis descuentos?",
        answer:
          "Si. Los paquetes combinados ya incluyen un 25-35% de ahorro. Ademas: 10% por fidelidad a partir del mes 6, 15% por pago anual en servicios recurrentes, y 10% de descuento mutuo en nuestro programa de referidos.",
      },
      {
        question: "Y si no me gusta el resultado?",
        answer:
          "Cada proyecto incluye 2 rondas de revision. Si despues de las revisiones no estas satisfecho, te devolvemos el dinero. Asi de simple. Trabajamos para que eso no pase, pero queremos que contrates sin riesgo.",
      },
    ],
  },
  {
    title: "Proceso de trabajo",
    color: "#84CC16",
    items: [
      {
        question: "Como es el proceso desde que contacto hasta que recibo mi proyecto?",
        answer:
          "1) Nos cuentas tu problema (formulario o email). 2) En menos de 24h recibes una propuesta con alcance, plazos y precio. 3) Apruebas y pagas el 50%. 4) Los agentes trabajan en tu proyecto con actualizaciones cada 2-3 dias. 5) Recibes el resultado, revisas y ajustamos. 6) Entrega final + documentacion.",
      },
      {
        question: "Cuanto tardais en entregar?",
        answer:
          "Landing page: 2-3 dias. Web corporativa: 5-7 dias. E-commerce: 10-15 dias. App/software a medida: 20-40 dias. Siempre te damos fecha de entrega concreta antes de empezar.",
      },
      {
        question: "Puedo hablar directamente con los agentes IA?",
        answer:
          "Si. Tendras acceso a un chat donde puedes comunicarte con los agentes que trabajan en tu proyecto. Tambien puedes escribir directamente a Pablo si prefieres trato humano. La comunicacion es fluida y respondemos en menos de 2 horas en horario laboral.",
      },
      {
        question: "Que pasa si necesito cambios urgentes despues de la entrega?",
        answer:
          "Los clientes con servicios recurrentes tienen prioridad y soporte continuo. Para proyectos puntuales, ofrecemos paquetes de mantenimiento desde 100 EUR/mes que incluyen cambios menores, actualizaciones de seguridad y soporte tecnico.",
      },
    ],
  },
  {
    title: "Servicios especificos",
    color: "#EA580C",
    items: [
      {
        question: "Haceis WordPress?",
        answer:
          "No. Trabajamos con Next.js, React y tecnologias modernas. Esto significa que tu web es mas rapida, mas segura, mejor posicionada en Google y no necesita actualizaciones de plugins constantemente. Sin codigo legacy, sin vulnerabilidades de WordPress.",
      },
      {
        question: "Podeis gestionar mis redes sociales?",
        answer:
          "Si. Pulse, nuestro agente de social media, crea contenido, gestiona calendarios editoriales y hace community management. Desde 300 EUR/mes para una red social hasta 1.500 EUR/mes para gestion completa multi-plataforma.",
      },
      {
        question: "Haceis campanas de Google Ads y Meta Ads?",
        answer:
          "Si. Nexus se encarga de todo: estrategia, segmentacion, creativos, A/B testing y optimizacion continua. Gestion desde 400 EUR/mes mas la inversion publicitaria. Tambien montamos embudos completos (landing + email + ads + automatizacion).",
      },
      {
        question: "Que incluye el servicio de SEO?",
        answer:
          "Atlas hace SEO completo: auditoria tecnica, investigacion de keywords, optimizacion on-page, contenido optimizado (4-8 articulos/mes), link building y reporting mensual. Desde 400 EUR/mes el plan basico hasta 1.200 EUR/mes el premium.",
      },
      {
        question: "Podeis hacer una app o software a medida?",
        answer:
          "Si. Core y Pixel construyen aplicaciones web completas: analisis de requisitos, diseno UX/UI, desarrollo full-stack, base de datos, panel de administracion y despliegue. Desde 5.000 EUR para apps sencillas hasta 15.000 EUR para proyectos complejos.",
      },
    ],
  },
  {
    title: "Comparativa con alternativas",
    color: "#EC4899",
    items: [
      {
        question: "Por que PACAME y no una agencia tradicional?",
        answer:
          "Una agencia tradicional cobra 5.000-15.000 EUR por una web y tarda 4-8 semanas. PACAME entrega la misma calidad desde 800 EUR en 5-7 dias. Mismo equipo multidisciplinar, sin el overhead de oficinas, reuniones internas y capas de gestion. Resultado: 60-80% mas barato, 3-4x mas rapido.",
      },
      {
        question: "Por que PACAME y no un freelancer?",
        answer:
          "Un freelancer es una persona. Si se pone enfermo, se va de vacaciones o tiene demasiado trabajo, tu proyecto para. Con PACAME tienes un equipo completo: disenadora, desarrolladora, SEO, growth hacker, community manager y estratega. Al precio de un freelancer, pero con la fiabilidad de una agencia.",
      },
      {
        question: "Por que PACAME y no hacerlo yo con Wix/Squarespace?",
        answer:
          "Wix te da una plantilla que se ve como mil webs mas. PACAME te da una estrategia digital completa: web personalizada, SEO profesional, copywriting que convierte, y codigo propio que no te cobra cuotas mensuales eternas. La diferencia es entre un folleto generico y una maquina de generar clientes.",
      },
    ],
  },
  {
    title: "Garantias y soporte",
    color: "#D97706",
    items: [
      {
        question: "Que garantia tengo?",
        answer:
          "Garantia de satisfaccion o devolucion del dinero. 2 rondas de revision incluidas en cada proyecto. Si despues de eso no te convence, te devolvemos el pago. Tambien ofrecemos 30 dias de soporte tecnico gratuito post-entrega.",
      },
      {
        question: "Que pasa si mi web se cae o tiene un problema?",
        answer:
          "Las webs desplegadas en Vercel tienen un 99.99% de uptime. Si algo falla, nuestro equipo responde en menos de 2 horas. Los clientes recurrentes tienen soporte prioritario incluido.",
      },
      {
        question: "Sois una empresa registrada?",
        answer:
          "PACAME opera desde Madrid, Espana. Pablo Calleja es el fundador y responsable legal. Todos los proyectos incluyen factura, contrato y cumplimiento RGPD.",
      },
      {
        question: "Mis datos estan seguros?",
        answer:
          "Si. Cumplimos con el RGPD. Los datos se almacenan en servidores europeos (Supabase EU), usamos encriptacion SSL en toda la comunicacion y nunca compartimos informacion de clientes con terceros.",
      },
    ],
  },
];

function FaqJsonLd() {
  const allFaqs = faqCategories.flatMap((cat) => cat.items);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function FaqPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      <FaqJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Preguntas frecuentes", url: "https://pacameagencia.com/faq" },
        ]}
      />
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-violet/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
            Preguntas frecuentes
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white leading-tight mb-6">
            Todas tus dudas.
            <br />
            <span className="gradient-text-vivid">Resueltas aqui.</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body font-light max-w-2xl mx-auto">
            Si no encuentras lo que buscas, escribenos y te respondemos en menos de 2 horas.
          </p>
        </ScrollReveal>
      </section>

      <FaqAccordion categories={faqCategories} />

      {/* CTA */}
      <section className="py-20 bg-pacame-black text-center">
        <div className="px-6"><GoldenDivider variant="line" /></div>
        <ScrollReveal className="max-w-2xl mx-auto px-6 pt-10">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            No has encontrado tu respuesta?
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Escribenos y te respondemos en menos de 2 horas. Sin compromiso.
          </p>
          <MagneticButton>
            <ShinyButton
              gradientFrom="#D4A853"
              gradientTo="#7C3AED"
              gradientOpacity={0.8}
              className="group min-w-[260px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
            >
              <Link href="/contacto" className="flex items-center gap-2 text-pacame-white">
                <MessageSquare className="w-5 h-5" />
                Escribir al equipo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </ShinyButton>
          </MagneticButton>
        </ScrollReveal>
      </section>
    </div>
  );
}
