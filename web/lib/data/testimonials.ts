export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
  service: string;
  avatar?: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Maria Garcia",
    role: "Fundadora",
    company: "Estudio Floral Maria",
    quote:
      "Llevabamos meses con una web que no recibia ni una visita. PACAME nos hizo una landing en 3 dias y el primer mes ya teniamos 40 leads. Brutal.",
    rating: 5,
    service: "landing-page",
  },
  {
    name: "Carlos Lopez",
    role: "Director Comercial",
    company: "Transportes Levante SL",
    quote:
      "Necesitabamos una web corporativa seria para dar confianza a nuestros clientes empresariales. El resultado supero todas las expectativas y la entregaron en una semana.",
    rating: 5,
    service: "web-corporativa",
  },
  {
    name: "Ana Martinez",
    role: "CEO",
    company: "Clinica Dental Sonrisa",
    quote:
      "Las redes sociales nos daban pereza, pero PACAME se encarga de todo. En 3 meses duplicamos seguidores y ahora nos llegan pacientes nuevos cada semana por Instagram.",
    rating: 5,
    service: "redes-growth",
  },
  {
    name: "Javier Ruiz",
    role: "Propietario",
    company: "Taller Mecanico Ruiz",
    quote:
      "La auditoria SEO nos abrio los ojos: teniamos 15 errores criticos en la web. Despues de 4 meses de SEO mensual, estamos en el top 3 de Google para 'taller mecanico Malaga'.",
    rating: 5,
    service: "seo-mensual",
  },
  {
    name: "Laura Fernandez",
    role: "Directora de Marketing",
    company: "Aceites Sierra Sur",
    quote:
      "El branding completo transformo nuestra marca. Pasamos de parecer una empresa de los 90 a una marca premium. Las ventas online subieron un 60% el primer trimestre.",
    rating: 5,
    service: "branding-completo",
  },
  {
    name: "Miguel Torres",
    role: "Gerente",
    company: "Inmobiliaria Costa del Sol",
    quote:
      "Con Meta Ads estamos consiguiendo leads de compradores internacionales a 8 euros por lead. Antes pagabamos portales inmobiliarios a 50 euros por contacto. El ROI es de locos.",
    rating: 5,
    service: "gestion-meta-ads",
  },
  {
    name: "Patricia Navarro",
    role: "Cofundadora",
    company: "Yoga & Bienestar Studio",
    quote:
      "La landing page que nos hicieron convierte al 12%. Cada euro que ponemos en anuncios nos devuelve 5. Es la mejor inversion que hemos hecho.",
    rating: 4,
    service: "landing-page",
  },
  {
    name: "Roberto Sanchez",
    role: "Director General",
    company: "Consultoria RS Partners",
    quote:
      "Contratamos el embudo completo: landing, emails, ads y automatizacion. En 2 meses generamos 200 leads cualificados y cerramos 15 contratos nuevos. Increible.",
    rating: 5,
    service: "embudo-completo",
  },
];

/**
 * Filter testimonials by service slug.
 */
export function getTestimonialsByService(serviceSlug: string): Testimonial[] {
  return testimonials.filter((t) => t.service === serviceSlug);
}

/**
 * Get featured testimonials (rating 5, up to `count`).
 */
export function getFeaturedTestimonials(count = 4): Testimonial[] {
  return testimonials.filter((t) => t.rating === 5).slice(0, count);
}
