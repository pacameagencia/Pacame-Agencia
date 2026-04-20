import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// ISR: terminos de servicio — 1h cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terminos de Servicio — PACAME",
  description:
    "Terminos y condiciones de contratacion de los servicios, apps y planes de PACAME Agencia Digital. Marketplace, suscripciones, propiedad intelectual y garantias.",
  alternates: { canonical: "https://pacameagencia.com/terminos-servicio" },
  robots: { index: true, follow: true },
};

export default function TerminosServicioPage() {
  return (
    <div className="bg-pacame-black min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          {
            name: "Terminos de Servicio",
            url: "https://pacameagencia.com/terminos-servicio",
          },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-12">
          <h1 className="font-heading font-bold text-4xl text-pacame-white mb-3">
            Terminos de Servicio
          </h1>
          <p className="text-pacame-white/60 text-sm">
            Ultima actualizacion: 19 abril 2026
          </p>
        </header>

        <div className="prose prose-invert prose-sm max-w-none font-body text-pacame-white/80 space-y-8 leading-relaxed">
          <p>
            Los presentes Terminos de Servicio regulan el acceso y uso de los
            servicios, aplicaciones y planes ofrecidos por PACAME a traves del
            dominio <span className="text-pacame-white/90">pacameagencia.com</span>.
            Al contratar o utilizar cualquiera de ellos el cliente acepta
            integramente estas condiciones.
          </p>

          {/* 1 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              1. Aceptacion
            </h2>
            <p>
              La contratacion de cualquier servicio del marketplace, la creacion de
              una cuenta en el portal del cliente, la adquisicion de una app
              productizada o la suscripcion a un plan mensual implican la aceptacion
              integra y sin reservas de estos Terminos, asi como de la{" "}
              <Link
                href="/privacidad"
                className="text-olympus-gold/80 hover:text-olympus-gold underline underline-offset-2"
              >
                Politica de Privacidad
              </Link>{" "}
              y la{" "}
              <Link
                href="/cookies"
                className="text-olympus-gold/80 hover:text-olympus-gold underline underline-offset-2"
              >
                Politica de Cookies
              </Link>
              . Si el cliente no esta de acuerdo con alguna clausula, debera
              abstenerse de contratar.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              2. Objeto del contrato
            </h2>
            <p>
              PACAME, titularidad de Pablo Calleja (NIF{" "}
              <span className="text-pacame-white/60">[NIF_PENDIENTE_PABLO]</span>),
              pone a disposicion del cliente los siguientes servicios, prestados
              con apoyo de agentes de inteligencia artificial supervisados por
              personal humano:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                <strong className="text-pacame-white">Marketplace de servicios digitales:</strong>{" "}
                paquetes productizados de branding, web, SEO, ads, copywriting,
                automatizaciones, analytics y estrategia.
              </li>
              <li>
                <strong className="text-pacame-white">Apps productizadas:</strong>{" "}
                aplicaciones operadas por PACAME (por ejemplo PACAME Agenda,
                chatbots, asistentes de voz) puestas a disposicion del cliente en
                modalidad SaaS.
              </li>
              <li>
                <strong className="text-pacame-white">Planes mensuales:</strong>{" "}
                servicios recurrentes de gestion integral (contenido, anuncios,
                SEO, asistencia, etc.) facturados periodicamente.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              3. Registro y cuenta de cliente
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                El cliente debe ser mayor de edad y actuar en su propio nombre o en
                nombre de una persona juridica con capacidad suficiente.
              </li>
              <li>
                Los datos aportados en el registro deben ser veraces, completos y
                estar actualizados. El cliente es responsable de su exactitud.
              </li>
              <li>
                El cliente es responsable de la custodia de sus credenciales de
                acceso. Cualquier operacion realizada con ellas se presume
                realizada por el.
              </li>
              <li>
                PACAME puede suspender o cerrar cuentas ante incumplimientos
                graves, informando al cliente.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              4. Productos y entregables generados con IA
            </h2>
            <p>
              PACAME utiliza sistemas de inteligencia artificial como herramienta
              de produccion. El cliente debe ser consciente de lo siguiente:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                El resultado final es revisado y validado por personal humano antes
                de su entrega.
              </li>
              <li>
                PACAME realiza un esfuerzo razonable para que los entregables sean
                originales, pero no puede garantizar de forma absoluta que un
                resultado generado por IA no guarde similitudes con obras
                preexistentes. Si el cliente detecta cualquier posible conflicto,
                debe notificarlo y PACAME lo revisara sin coste.
              </li>
              <li>
                PACAME no responde de decisiones comerciales tomadas por el cliente
                unicamente sobre la base de los entregables (por ejemplo, campanas
                publicadas sin revision).
              </li>
              <li>
                El cliente dispone de un periodo de revisiones especificado en cada
                paquete. Las revisiones adicionales pueden conllevar un coste extra
                comunicado previamente.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              5. Precios, pagos, Stripe e impuestos
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                Los precios se muestran en euros (EUR). Salvo indicacion en
                contrario, se entienden con el IVA espanol aplicable del 21%
                incluido para consumidores; las empresas identificadas con NIF-IVA
                intracomunitario valido pueden acogerse a los supuestos de
                inversion del sujeto pasivo.
              </li>
              <li>
                Los pagos se procesan a traves de{" "}
                <strong className="text-pacame-white">Stripe Payments Europe</strong>
                , certificado PCI-DSS Level 1. PACAME no almacena datos completos de
                tarjeta.
              </li>
              <li>
                Los servicios puntuales requieren el pago completo antes del inicio
                salvo acuerdo expreso en contrario.
              </li>
              <li>
                Las apps y planes se facturan de forma recurrente al inicio del
                periodo contratado. Stripe guarda de forma segura el medio de pago.
              </li>
              <li>
                En caso de impago, PACAME puede suspender el servicio previa
                notificacion y sin perjuicio de reclamar el importe pendiente.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              6. Suscripciones: renovacion, cancelacion y reembolsos
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                Las suscripciones se renuevan automaticamente al final de cada
                periodo (mensual o anual) al mismo precio vigente, salvo subida
                comunicada con 30 dias de antelacion.
              </li>
              <li>
                <strong className="text-pacame-white">Sin permanencia:</strong> el
                cliente puede cancelar en cualquier momento desde su portal o
                escribiendo a{" "}
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-olympus-gold/80 hover:text-olympus-gold underline underline-offset-2"
                >
                  hola@pacameagencia.com
                </a>
                . La cancelacion surte efecto al finalizar el periodo ya facturado.
              </li>
              <li>
                <strong className="text-pacame-white">Derecho de desistimiento:</strong>{" "}
                los consumidores tienen 14 dias naturales para desistir sin
                justificacion. No obstante, si el cliente ha solicitado el inicio
                inmediato del servicio y este ya se ha ejecutado total o
                parcialmente, se facturara la parte proporcional efectivamente
                prestada conforme al art. 108 del Real Decreto Legislativo 1/2007.
              </li>
              <li>
                En servicios con entregables digitales personalizados (logos,
                textos, codigo) el cliente reconoce que, una vez iniciada la
                ejecucion con su consentimiento expreso, pierde el derecho de
                desistimiento sobre esa parte ya entregada.
              </li>
              <li>
                Las solicitudes de reembolso fuera de los supuestos anteriores se
                evaluan caso por caso y de buena fe.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              7. Propiedad intelectual
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-pacame-white/70">
              <li>
                <strong className="text-pacame-white">Plataforma PACAME:</strong> la
                infraestructura, codigo fuente, diseno del portal, marca, agentes
                IA, workflows internos y documentacion son propiedad exclusiva de
                PACAME. El contrato no transfiere ningun derecho sobre ellos.
              </li>
              <li>
                <strong className="text-pacame-white">Entregables contratados:</strong>{" "}
                una vez abonado el precio integro, el cliente adquiere los derechos
                de uso, reproduccion, transformacion y distribucion con caracter
                mundial y sin limite temporal sobre los entregables concretos del
                encargo (por ejemplo logo, textos, paginas web, piezas creativas).
              </li>
              <li>
                <strong className="text-pacame-white">Contenido generado por IA:</strong>{" "}
                en los entregables en los que intervienen modelos generativos,
                PACAME transfiere al cliente todos los derechos que legalmente
                puedan atribuirse a dichos resultados. No obstante, conforme a la
                normativa vigente, la titularidad de un derecho de autor en sentido
                estricto sobre contenido integramente generado por IA puede no ser
                reconocible. PACAME garantiza un esfuerzo diligente de originalidad
                y se compromete a sustituir sin coste cualquier entregable que
                resulte infractor de derechos de tercero.
              </li>
              <li>
                <strong className="text-pacame-white">Materiales del cliente:</strong>{" "}
                el cliente garantiza ser titular o licenciatario de los materiales
                aportados (textos, imagenes, marcas) y exime a PACAME de cualquier
                reclamacion derivada de su uso.
              </li>
              <li>
                PACAME conserva el derecho a mencionar al cliente como referencia
                comercial y mostrar los trabajos realizados en su portfolio, salvo
                peticion expresa por escrito en contrario.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              8. Uso permitido y restricciones
            </h2>
            <p>
              El cliente se compromete a utilizar los servicios conforme a la ley,
              estos Terminos y la buena fe. En particular, queda prohibido:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                Revender, sublicenciar o comercializar los servicios o agentes IA
                de PACAME sin acuerdo escrito.
              </li>
              <li>
                Utilizar los servicios para actividades ilegales, enganosas,
                difamatorias, que infrinjan derechos de terceros, fomenten el odio
                o la violencia, o para spam o scraping masivo no consentido.
              </li>
              <li>
                Realizar ingenieria inversa, descompilar u obtener el codigo fuente
                de la plataforma.
              </li>
              <li>
                Abusar de los agentes IA con prompts destinados a extraer
                informacion confidencial, generar contenido ilicito o degradar el
                servicio para otros clientes.
              </li>
              <li>
                Saturar deliberadamente los recursos (rate limit) o intentar eludir
                los controles de seguridad.
              </li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              9. Disponibilidad del servicio y SLA
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                PACAME trabaja para mantener una disponibilidad objetivo del{" "}
                <strong className="text-pacame-white">99,9%</strong> mensual en el
                portal y las apps productizadas, en modalidad &quot;best-effort&quot;.
              </li>
              <li>
                No se garantiza un uptime del 100%. Pueden existir ventanas de
                mantenimiento programadas (avisadas con 48h de antelacion) o
                incidencias de terceros (Vercel, Supabase, Stripe) ajenas al control
                de PACAME.
              </li>
              <li>
                PACAME mantiene un estado publico en{" "}
                <Link
                  href="/status"
                  className="text-olympus-gold/80 hover:text-olympus-gold underline underline-offset-2"
                >
                  /status
                </Link>
                .
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              10. Limitacion de responsabilidad
            </h2>
            <p>
              En la maxima medida permitida por el Derecho imperativo, la
              responsabilidad agregada de PACAME frente al cliente por cualquier
              reclamacion derivada del contrato o relacionada con el se limita al{" "}
              <strong className="text-pacame-white">
                importe efectivamente abonado por el cliente en los 12 meses
                anteriores
              </strong>{" "}
              al hecho causante. En ningun caso PACAME respondera de danos
              indirectos, lucro cesante, perdida de oportunidad o dano reputacional.
            </p>
            <p>
              Esta limitacion no se aplica en los supuestos en los que la ley no
              permita excluirla (dolo, culpa grave, danos a la vida o integridad
              fisica, o responsabilidad del consumidor conforme al TRLGDCU).
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              11. Indemnizacion
            </h2>
            <p>
              El cliente mantendra indemne a PACAME frente a reclamaciones de
              terceros derivadas de: (i) el uso indebido del servicio por parte del
              cliente, (ii) la infraccion de derechos de tercero por parte de los
              materiales o instrucciones aportados por el cliente, o (iii) el
              incumplimiento por parte del cliente de sus obligaciones legales o
              contractuales.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              12. Modificacion del servicio
            </h2>
            <p>
              PACAME puede modificar, anadir o retirar funcionalidades con el
              objetivo de mejorar la plataforma. Cuando un cambio afecte
              sustancialmente al servicio contratado, se comunicara con al menos 30
              dias de antelacion. El cliente podra resolver el contrato sin penalty
              si el cambio le perjudica.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              13. Terminacion
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-pacame-white/70">
              <li>
                El cliente puede terminar el contrato en cualquier momento segun lo
                previsto en la seccion 6.
              </li>
              <li>
                PACAME puede resolver el contrato de forma inmediata en caso de
                impago persistente, fraude, abuso de la plataforma o incumplimiento
                grave por parte del cliente.
              </li>
              <li>
                Tras la terminacion, PACAME conservara los datos del cliente
                durante los plazos fijados en la Politica de Privacidad, y
                facilitara una exportacion de los entregables a peticion del cliente
                durante los 60 dias siguientes.
              </li>
            </ul>
          </section>

          {/* 14 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              14. Ley aplicable y jurisdiccion
            </h2>
            <p>
              Estos Terminos se rigen por el Derecho espanol. Para la resolucion de
              cualquier controversia, ambas partes se someten expresamente a los
              juzgados y tribunales de Madrid capital, salvo que una norma
              imperativa aplicable al consumidor establezca otro fuero. Los
              consumidores residentes en la UE pueden acudir tambien a la
              plataforma europea de resolucion de litigios en linea:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-olympus-gold/80 hover:text-olympus-gold underline underline-offset-2"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-olympus-gold mb-4">
              15. Contacto
            </h2>
            <p>
              Para cualquier cuestion relacionada con estos Terminos:
            </p>
            <ul className="list-none space-y-1 text-pacame-white/75">
              <li>
                Email:{" "}
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-olympus-gold/80 hover:text-olympus-gold underline underline-offset-2"
                >
                  hola@pacameagencia.com
                </a>
              </li>
              <li>WhatsApp: +34 722 669 381</li>
              <li>Web: pacameagencia.com</li>
            </ul>
          </section>

          {/* Cross-links */}
          <div className="pt-10 border-t border-white/[0.06] flex flex-wrap gap-4">
            <Link
              href="/privacidad"
              className="text-xs text-pacame-white/50 hover:text-pacame-white/80 transition-colors"
            >
              Politica de Privacidad
            </Link>
            <Link
              href="/aviso-legal"
              className="text-xs text-pacame-white/50 hover:text-pacame-white/80 transition-colors"
            >
              Aviso Legal
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-pacame-white/50 hover:text-pacame-white/80 transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/accesibilidad"
              className="text-xs text-pacame-white/50 hover:text-pacame-white/80 transition-colors"
            >
              Accesibilidad
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
