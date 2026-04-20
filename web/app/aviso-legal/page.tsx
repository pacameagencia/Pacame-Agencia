import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// ISR: aviso legal — 1h cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Aviso Legal — PACAME",
  description:
    "Aviso legal e informacion sobre el titular de pacameagencia.com en cumplimiento de la LSSI-CE (Ley 34/2002).",
  alternates: { canonical: "https://pacameagencia.com/aviso-legal" },
  robots: { index: true, follow: true },
};

export default function AvisoLegalPage() {
  return (
    <div className="bg-paper min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Aviso Legal", url: "https://pacameagencia.com/aviso-legal" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-12">
          <h1 className="font-heading font-bold text-4xl text-ink mb-3">
            Aviso Legal
          </h1>
          <p className="text-ink/60 text-sm">
            Ultima actualizacion: 19 abril 2026
          </p>
        </header>

        <div className="prose prose-invert prose-sm max-w-none font-body text-ink/80 space-y-8 leading-relaxed">
          <p>
            En cumplimiento del articulo 10 de la Ley 34/2002, de 11 de julio, de
            Servicios de la Sociedad de la Informacion y de Comercio Electronico
            (LSSI-CE), se pone a disposicion de los usuarios y autoridades
            competentes la siguiente informacion relativa al titular del sitio web{" "}
            <span className="text-ink/90">pacameagencia.com</span>.
          </p>

          {/* 1 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              1. Datos identificativos del responsable
            </h2>
            <ul className="list-none space-y-1 text-ink/75">
              <li>
                <strong className="text-ink">Titular:</strong> Pablo
                Calleja (&quot;PACAME&quot;).
              </li>
              <li>
                <strong className="text-ink">NIF:</strong>{" "}
                <span className="text-ink/60">
                  [NIF_PENDIENTE_PABLO]
                </span>
              </li>
              <li>
                <strong className="text-ink">Domicilio:</strong>{" "}
                <span className="text-ink/60">
                  [DOMICILIO_FISCAL_PENDIENTE_PABLO]
                </span>
                , Madrid, Espana.
              </li>
              <li>
                <strong className="text-ink">Email:</strong>{" "}
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  hola@pacameagencia.com
                </a>
              </li>
              <li>
                <strong className="text-ink">Telefono / WhatsApp:</strong>{" "}
                +34 722 669 381
              </li>
              <li>
                <strong className="text-ink">Sitio web:</strong>{" "}
                pacameagencia.com
              </li>
              <li>
                <strong className="text-ink">Datos registrales:</strong>{" "}
                <span className="text-ink/60">
                  [DATOS_REGISTRALES_PENDIENTE_PABLO]
                </span>{" "}
                (Registro Mercantil o inscripcion como autonomo en IAE).
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              2. Actividad
            </h2>
            <p>
              PACAME presta servicios de agencia digital con apoyo de agentes de
              inteligencia artificial: branding, diseno web, SEO, publicidad
              online, redes sociales, automatizaciones, analytics, copywriting y
              apps productizadas (marketplace de servicios y planes mensuales). Las
              actividades se dirigen principalmente a pequenas y medianas empresas
              en Espana y el resto de la Union Europea.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              3. Legislacion aplicable
            </h2>
            <p>
              Este sitio web y los servicios prestados a traves del mismo se rigen
              por la legislacion espanola y de la Union Europea. En particular, son
              de aplicacion:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Ley 34/2002, de Servicios de la Sociedad de la Informacion (LSSI-CE).</li>
              <li>Reglamento (UE) 2016/679, General de Proteccion de Datos (RGPD).</li>
              <li>
                Ley Organica 3/2018, de Proteccion de Datos Personales y Garantia
                de los Derechos Digitales (LOPDGDD).
              </li>
              <li>
                Real Decreto Legislativo 1/2007, Texto Refundido de la Ley General
                para la Defensa de los Consumidores y Usuarios (TRLGDCU).
              </li>
              <li>Real Decreto Legislativo 1/1996, Ley de Propiedad Intelectual.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              4. Condiciones de uso del sitio
            </h2>
            <p>
              El acceso al sitio web es libre y gratuito, salvo en aquellas
              secciones que requieran registro o contratacion de servicios. El
              usuario se compromete a hacer un uso diligente del sitio conforme a
              la ley, la moral y el presente Aviso Legal. En particular, queda
              prohibido:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                Utilizar el sitio para actividades ilicitas, fraudulentas o
                contrarias a la buena fe.
              </li>
              <li>
                Transmitir virus, codigo malicioso o cualquier elemento que pueda
                dañar el sistema.
              </li>
              <li>
                Intentar acceder sin autorizacion a areas restringidas o a los
                sistemas del responsable o de los usuarios.
              </li>
              <li>
                Reproducir, distribuir o transformar los contenidos del sitio sin
                autorizacion.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              5. Propiedad intelectual e industrial del sitio
            </h2>
            <p>
              La totalidad del sitio web (codigo fuente, diseno, estructura,
              textos, imagenes, logotipos, marca, bases de datos, agentes IA
              desarrollados por PACAME) es titularidad de Pablo Calleja / PACAME o
              de terceros con licencia correspondiente, y esta protegida por la
              normativa espanola y comunitaria de propiedad intelectual e
              industrial.
            </p>
            <p>
              Queda expresamente prohibida su reproduccion total o parcial,
              transformacion, distribucion, comunicacion publica o cualquier otro
              acto de explotacion sin autorizacion expresa y escrita del titular.
              El nombre comercial &quot;PACAME&quot; y los logotipos asociados son
              signos distintivos protegidos y no podran ser utilizados sin
              consentimiento.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              6. Enlaces a sitios de terceros
            </h2>
            <p>
              El sitio puede incluir enlaces a paginas de terceros. PACAME no
              asume responsabilidad alguna sobre el contenido, las politicas de
              privacidad ni las practicas de dichos sitios. La inclusion de enlaces
              es a titulo informativo y no supone recomendacion, adhesion o
              aprobacion de los contenidos o servicios enlazados.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              7. Exencion de responsabilidad
            </h2>
            <p>
              PACAME realiza los esfuerzos razonables para mantener el sitio
              operativo y los contenidos actualizados. Sin embargo, no se
              responsabiliza de:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                Interrupciones, errores u omisiones en los contenidos o en el
                funcionamiento del sitio.
              </li>
              <li>
                Danos causados por virus o elementos lesivos presentes en los
                sistemas del usuario.
              </li>
              <li>
                El uso que terceros hagan de la informacion publicada en el sitio.
              </li>
              <li>
                Decisiones tomadas por el usuario unicamente sobre la base de
                informacion general publicada en el sitio que no tenga caracter de
                asesoramiento contractualizado.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              8. Modificaciones
            </h2>
            <p>
              PACAME se reserva el derecho a modificar en cualquier momento el
              contenido del sitio y el presente Aviso Legal para adaptarlo a
              cambios normativos, tecnicos o del negocio. La version vigente sera
              la publicada en esta URL con su fecha de ultima actualizacion.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              9. Legislacion aplicable y jurisdiccion
            </h2>
            <p>
              El presente Aviso Legal se rige por la legislacion espanola. Para la
              resolucion de cualquier controversia derivada de su interpretacion o
              aplicacion, las partes se someten a los juzgados y tribunales de
              Madrid, salvo que una norma imperativa aplicable al consumidor
              establezca otro fuero.
            </p>
          </section>

          {/* Cross-links */}
          <div className="pt-10 border-t border-ink/[0.06] flex flex-wrap gap-4">
            <Link
              href="/privacidad"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Politica de Privacidad
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/terminos-servicio"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Terminos de Servicio
            </Link>
            <Link
              href="/accesibilidad"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Accesibilidad
            </Link>
            <Link
              href="/"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
