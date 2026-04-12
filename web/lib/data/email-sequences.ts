// Email nurturing sequences for PACAME leads
// Each sequence has emails sent at intervals after lead creation

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  cta: { text: string; url: string };
  delay_hours: number; // hours after lead creation (or previous email)
}

export interface EmailSequence {
  id: string;
  name: string;
  trigger: "new_lead" | "proposal_sent" | "newsletter" | "post_delivery";
  description: string;
  emails: EmailTemplate[];
}

export const sequences: EmailSequence[] = [
  {
    id: "welcome",
    name: "Bienvenida + Nurturing",
    trigger: "new_lead",
    description: "Secuencia de 4 emails para leads nuevos que llegan por formulario de contacto",
    emails: [
      {
        id: "welcome_1",
        subject: "{{name}}, ya te tenemos en el radar",
        delay_hours: 0, // Immediate
        body: `Hola {{name}},

Soy Pablo, el fundador de PACAME. He recibido tu mensaje y queria confirmarte personalmente que lo estamos revisando.

En menos de 24 horas recibiras una propuesta personalizada con:
- Que servicios encajan con lo que necesitas
- Precio exacto, sin sorpresas
- Plazo de entrega concreto

Mientras tanto, te dejo 3 cosas que te pueden servir:

1. Nuestro catalogo de servicios con precios: https://pacameagencia.com/servicios
2. Casos de exito con metricas reales: https://pacameagencia.com/portfolio
3. Preguntas frecuentes: https://pacameagencia.com/faq

Si tienes prisa, respondeme a este email o escribeme por WhatsApp al +34 722 669 381. Respondo personalmente.

Un saludo,
Pablo Calleja
CEO de PACAME`,
        cta: { text: "Ver servicios y precios", url: "https://pacameagencia.com/servicios" },
      },
      {
        id: "welcome_2",
        subject: "Esto es lo que hacemos diferente (en 60 segundos)",
        delay_hours: 48, // 2 days after
        body: `{{name}}, te cuento algo rapido.

El 78% de las PYMEs en Espana no tiene presencia digital profesional. Las que la tienen, pagaron 5.000-15.000 EUR a una agencia y esperaron 2 meses.

En PACAME hacemos lo mismo, pero:
- 60-80% mas barato (una web corporativa desde 800 EUR)
- 3-4x mas rapido (5-7 dias, no 2 meses)
- Con un equipo de 10 especialistas, no 1 freelancer

¿Como? Tenemos un equipo de agentes IA especializados: una disenadora, un estratega SEO, un growth hacker, un desarrollador... Cada uno experto en lo suyo. Y yo superviso cada entrega personalmente.

El resultado es indistinguible de una agencia premium. El precio, no.

¿Te interesa que te prepare una propuesta personalizada? Solo respondeme a este email con un "si".

Pablo
PACAME`,
        cta: { text: "Ver el equipo completo", url: "https://pacameagencia.com/equipo" },
      },
      {
        id: "welcome_3",
        subject: "Un caso real: de 0 leads a 24/mes en 5 dias",
        delay_hours: 120, // 5 days after
        body: `{{name}},

Te comparto un caso que a muchos les sorprende:

ANTES: Construcciones Martinez tenia una web de 2018 en WordPress. 0 leads online. Todo era boca a boca.

DESPUES (5 dias con PACAME):
- Web corporativa nueva con formulario inteligente
- SEO local optimizado para "reformas Madrid"
- Google Business configurado

RESULTADO:
- 24 leads/mes (desde 0)
- +640% trafico organico
- Top 5 en Google para "reformas madrid"
- Inversion total: 1.200 EUR

Ese es un ejemplo de lo que podemos hacer por tu negocio. ¿Y si hablamos 30 minutos esta semana para ver que necesitas exactamente?

Sin compromiso. Sin presupuestos ciegos. Solo una conversacion honesta.

Pablo
PACAME`,
        cta: { text: "Ver mas casos de exito", url: "https://pacameagencia.com/portfolio" },
      },
      {
        id: "welcome_4",
        subject: "Ultima pregunta, {{name}}",
        delay_hours: 240, // 10 days after
        body: `{{name}},

No quiero ser pesado, pero tampoco quiero que te quedes sin la ayuda que necesitas.

Una pregunta directa: ¿que es lo que mas te frena ahora mismo?

A) No estoy seguro de que necesito exactamente
B) El presupuesto me preocupa
C) Estoy comparando opciones
D) Ahora no es buen momento, pero quizas en unos meses

Respondeme con la letra y te oriento en 2 minutos. Sin compromiso, sin rollo comercial.

Si la respuesta es D, lo respeto al 100%. Te apunto para contactarte cuando sea buen momento.

Un saludo,
Pablo Calleja
PACAME | pacameagencia.com`,
        cta: { text: "Contactar directamente", url: "https://pacameagencia.com/contacto" },
      },
    ],
  },
  {
    id: "post_proposal",
    name: "Follow-up de propuesta",
    trigger: "proposal_sent",
    description: "Secuencia de 3 emails despues de enviar propuesta",
    emails: [
      {
        id: "proposal_1",
        subject: "Tu propuesta esta lista, {{name}}",
        delay_hours: 0,
        body: `{{name}},

Tu propuesta personalizada esta lista. La puedes revisar aqui: {{proposal_url}}

Resumen rapido:
- Servicios: {{services}}
- Inversion: {{total_price}}
- Plazo estimado: {{timeline}}

Incluye todo lo que hablamos: {{brief_summary}}

Si tienes alguna duda o quieres ajustar algo, respondeme directamente. Cada propuesta es flexible.

Pablo
PACAME`,
        cta: { text: "Ver propuesta completa", url: "{{proposal_url}}" },
      },
      {
        id: "proposal_2",
        subject: "¿Has podido revisar la propuesta?",
        delay_hours: 72, // 3 days
        body: `{{name}},

Solo queria asegurarme de que has recibido la propuesta que te envie. Si tienes cualquier duda, estoy aqui para resolverla.

Cosas que me suelen preguntar:
- ¿Se puede ajustar el alcance? Si, siempre.
- ¿Como es el proceso de pago? 50% al inicio, 50% a la entrega.
- ¿Que garantia tengo? Satisfaccion o devolucion. 2 rondas de revision incluidas.

Un dato: el 92% de nuestros clientes aceptan la propuesta en menos de 7 dias. Los que tardan mas suelen querer ajustar algo — y eso esta perfecto.

¿Hablamos?

Pablo`,
        cta: { text: "Revisar propuesta", url: "{{proposal_url}}" },
      },
      {
        id: "proposal_3",
        subject: "La propuesta caduca en 7 dias",
        delay_hours: 168, // 7 days
        body: `{{name}},

Tu propuesta tiene validez de 14 dias y quedan 7.

No es por meterle prisa — es porque los precios de herramientas y costes cambian, y quiero garantizarte lo que te ofreci.

Si ahora no es buen momento, lo entiendo perfectamente. Respondeme con un "mas adelante" y te contacto cuando prefieras.

Si tienes dudas que te frenan, cuentamelas. Literalmente 2 minutos de tu tiempo y las resolvemos.

Pablo
PACAME`,
        cta: { text: "Aceptar propuesta", url: "{{proposal_url}}" },
      },
    ],
  },
  {
    id: "post_delivery",
    name: "Post-entrega + Upsell",
    trigger: "post_delivery",
    description: "Secuencia de 3 emails despues de entregar un proyecto",
    emails: [
      {
        id: "delivery_1",
        subject: "Tu proyecto esta listo. ¿Todo bien?",
        delay_hours: 24, // 1 day after delivery
        body: `{{name}},

Tu {{project_type}} ya esta en marcha. Queria hacer un check rapido:

- ¿Funciona todo correctamente?
- ¿Hay algo que quieras ajustar?
- ¿Necesitas ayuda con algo del panel de administracion?

Tienes 30 dias de soporte tecnico gratuito incluidos. Cualquier duda, respondeme aqui o por WhatsApp.

Me encantaria que me dejaras una resena breve si la experiencia ha sido buena. Nos ayuda mucho como equipo pequeno: {{review_url}}

Pablo
PACAME`,
        cta: { text: "Dejar una resena", url: "{{review_url}}" },
      },
      {
        id: "delivery_2",
        subject: "3 semanas despues: ¿como van los numeros?",
        delay_hours: 504, // 21 days
        body: `{{name}},

Han pasado 3 semanas desde que lanzamos tu {{project_type}}. Es el momento perfecto para revisar como va:

En nuestro dashboard puedes ver:
- Trafico web y tendencias
- Leads generados (si aplica)
- Posicionamiento SEO (si aplica)

Si los numeros son buenos, genial. Si no son los que esperabas, hablemos. Hay varias cosas que podemos hacer para acelerar resultados:

- SEO mensual (para posicionar en Google a medio plazo)
- Meta Ads (para resultados inmediatos de trafico)
- Redes sociales (para construir marca y comunidad)

¿Te interesa que te prepare una propuesta de crecimiento? Sin compromiso.

Pablo`,
        cta: { text: "Ver servicios de crecimiento", url: "https://pacameagencia.com/servicios" },
      },
      {
        id: "delivery_3",
        subject: "Descuento especial para ti, {{name}}",
        delay_hours: 720, // 30 days
        body: `{{name}},

Un mes desde la entrega. Si todo va bien y estas contento con el trabajo, tengo algo para ti:

15% de descuento en cualquier servicio recurrente que contrates este mes:
- SEO mensual: desde 340 EUR/mes (en vez de 400 EUR)
- Redes sociales: desde 255 EUR/mes (en vez de 300 EUR)
- Gestion de Ads: desde 340 EUR/mes (en vez de 400 EUR)

Es nuestro descuento de "pack web + recurrente" para clientes que ya han confiado en nosotros.

Tambien recuerda: si recomiendas PACAME a alguien, ambos teneis un 10% de descuento adicional.

¿Hablamos?

Pablo
PACAME`,
        cta: { text: "Ver opciones de crecimiento", url: "https://pacameagencia.com/servicios" },
      },
    ],
  },
];
