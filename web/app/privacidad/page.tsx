import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// ISR: politica de privacidad — 1h cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Politica de Privacidad — PACAME",
  description:
    "Politica de privacidad y proteccion de datos de PACAME Agencia Digital, conforme al RGPD, la LOPDGDD y la LSSI. Derechos del usuario, bases legales y encargados del tratamiento.",
  alternates: { canonical: "https://pacameagencia.com/privacidad" },
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return (
    <div className="bg-paper min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Privacidad", url: "https://pacameagencia.com/privacidad" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-12">
          <h1 className="font-heading font-bold text-4xl text-ink mb-3">
            Politica de Privacidad
          </h1>
          <p className="text-ink/60 text-sm">
            Ultima actualizacion: 19 abril 2026
          </p>
        </header>

        <div className="prose prose-invert prose-sm max-w-none font-body text-ink/80 space-y-8 leading-relaxed">
          <p>
            En PACAME nos tomamos la privacidad muy en serio. Esta politica explica que
            datos personales tratamos, con que finalidad, durante cuanto tiempo y con
            quien los compartimos. Se aplica a todos los servicios prestados a traves
            de <span className="text-ink/90">pacameagencia.com</span>, el
            marketplace de servicios digitales, las aplicaciones productizadas y los
            planes mensuales.
          </p>

          {/* 1 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              1. Responsable del tratamiento
            </h2>
            <ul className="list-none space-y-1 text-ink/75">
              <li>
                <strong className="text-ink">Titular:</strong> Pablo Calleja
                (&quot;PACAME&quot; o &quot;PACAME Agencia Digital&quot;).
              </li>
              <li>
                <strong className="text-ink">NIF:</strong>{" "}
                <span className="text-ink/60">[NIF_PENDIENTE_PABLO]</span>
              </li>
              <li>
                <strong className="text-ink">Domicilio:</strong>{" "}
                <span className="text-ink/60">
                  [DOMICILIO_FISCAL_PENDIENTE_PABLO]
                </span>
                , Madrid, Espana.
              </li>
              <li>
                <strong className="text-ink">Email de contacto:</strong>{" "}
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  hola@pacameagencia.com
                </a>
              </li>
              <li>
                <strong className="text-ink">WhatsApp:</strong> +34 722 669 381
              </li>
              <li>
                <strong className="text-ink">Delegado de proteccion de datos (DPO):</strong>{" "}
                al tratarse de una empresa unipersonal que no realiza tratamientos a
                gran escala de categorias especiales, PACAME no esta obligada a
                designar un DPO formal conforme al articulo 37 del RGPD. Las
                consultas relativas a proteccion de datos se canalizan a
                <a
                  href="mailto:hola@pacameagencia.com"
                  className="ml-1 text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  hola@pacameagencia.com
                </a>
                .
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              2. Finalidades del tratamiento
            </h2>
            <p>
              Tratamos datos personales unicamente para las finalidades legitimas y
              explicitas descritas a continuacion, agrupadas por tipo de interesado:
            </p>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.1. Clientes (contratacion de servicios)
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Gestion de la relacion contractual y prestacion de los servicios.</li>
              <li>Facturacion, cobro y cumplimiento de obligaciones fiscales.</li>
              <li>Comunicaciones operativas (entregas, revisiones, soporte).</li>
              <li>Atencion al cliente y resolucion de incidencias.</li>
              <li>
                Envio de comunicaciones comerciales de servicios similares (articulo
                21.2 LSSI) con posibilidad de oposicion en cualquier momento.
              </li>
            </ul>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.2. Usuarios finales de aplicaciones productizadas
            </h3>
            <p>
              Ciertas aplicaciones de PACAME (por ejemplo, el sistema de reservas
              PACAME Agenda) son utilizadas por los usuarios finales de nuestros
              clientes. En estos casos PACAME actua como{" "}
              <strong className="text-ink">encargado del tratamiento</strong>{" "}
              en nombre del cliente (que es el responsable del tratamiento). Las
              finalidades se limitan a ejecutar el servicio que el cliente ofrece a
              sus propios usuarios.
            </p>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.3. Contactos comerciales y leads de prospeccion (outreach B2B)
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                Contacto comercial inicial dirigido a profesionales y empresas,
                utilizando exclusivamente datos profesionales de fuentes publicas
                (Google Maps, directorios sectoriales, webs corporativas).
              </li>
              <li>
                Calificacion automatica del lead mediante IA supervisada por Pablo
                Calleja.
              </li>
              <li>
                Envio de propuestas personalizadas por email o WhatsApp Business.
              </li>
            </ul>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.4. Suscriptores del newsletter y usuarios del formulario de contacto
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Responder a consultas realizadas a traves de formularios.</li>
              <li>
                Envio periodico de contenido sobre marketing digital e IA aplicada a
                PYMEs (previo consentimiento explicito).
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              3. Bases legales que legitiman el tratamiento
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-ink/70">
              <li>
                <strong className="text-ink">Ejecucion de contrato</strong>{" "}
                (art. 6.1.b RGPD): para clientes que han contratado cualquier
                servicio, app o plan mensual. Incluye facturacion, soporte y
                entregables.
              </li>
              <li>
                <strong className="text-ink">Consentimiento</strong> (art.
                6.1.a RGPD): para suscripciones a newsletter, cookies no esenciales,
                llamadas mediante agentes de voz IA y cualquier comunicacion
                comercial fuera del supuesto del 21.2 LSSI.
              </li>
              <li>
                <strong className="text-ink">Interes legitimo</strong> (art.
                6.1.f RGPD): contacto comercial B2B a profesionales en el ambito de
                sus funciones, prevencion del fraude, mejora del servicio y
                seguridad. En todos los casos PACAME realiza una ponderacion previa
                para garantizar que prevalecen los intereses del responsable sobre
                los derechos del interesado, y permite oposicion sencilla.
              </li>
              <li>
                <strong className="text-ink">Obligacion legal</strong> (art.
                6.1.c RGPD): cumplimiento de normativa fiscal, contable y mercantil
                espanola.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              4. Datos que recogemos
            </h2>

            <h3 className="font-heading font-medium text-lg text-ink mt-4 mb-2">
              4.1. Clientes
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Nombre y apellidos, razon social, NIF/CIF.</li>
              <li>Email, telefono, direccion postal y fiscal.</li>
              <li>
                Informacion sobre el negocio (sector, tamano, objetivos, URL, redes).
              </li>
              <li>
                Datos de pago gestionados exclusivamente por Stripe (PACAME no
                almacena numeros de tarjeta).
              </li>
              <li>
                Credenciales o accesos que el cliente decida compartir para ejecutar
                el encargo (se rigen por contrato de encargo de tratamiento y
                politica de aislamiento).
              </li>
            </ul>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              4.2. Usuarios finales de apps
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Nombre, email y telefono cuando el cliente asi lo configura.</li>
              <li>Metadata de uso (reservas, mensajes, interacciones).</li>
            </ul>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              4.3. Contactos B2B de prospeccion
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Nombre del negocio, email corporativo y telefono profesional.</li>
              <li>Informacion publica accesible en fuentes abiertas.</li>
            </ul>

            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              4.4. Navegacion
            </h3>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>Direccion IP, identificador de sesion, agente de usuario.</li>
              <li>Cookies tecnicas, analiticas y de funcionalidad (ver seccion 10).</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              5. Categorias de destinatarios y encargados del tratamiento
            </h2>
            <p>
              Para prestar los servicios de forma adecuada, PACAME contrata a
              terceros que actuan como encargados del tratamiento. Todos ellos estan
              sometidos a contrato de encargo (art. 28 RGPD):
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                <strong className="text-ink">Supabase</strong> (base de
                datos, autenticacion) — servidores en la UE (region eu-west-3).{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Stripe Payments Europe</strong>{" "}
                (pagos, certificado PCI-DSS Level 1).{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Resend</strong> (envio de
                emails transaccionales).{" "}
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Meta Platforms Ireland</strong>{" "}
                (WhatsApp Business API, App PACAME Contact).{" "}
                <a
                  href="https://www.whatsapp.com/legal/business-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Vapi</strong> (llamadas de voz
                con IA, solo con opt-in explicito).{" "}
                <a
                  href="https://vapi.ai/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Upstash</strong> (rate limiting
                Redis).{" "}
                <a
                  href="https://upstash.com/trust/privacy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Sentry</strong> (monitorizacion
                de errores, PII redactada en origen).{" "}
                <a
                  href="https://sentry.io/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Apify</strong> (scraping de
                datos publicos B2B — Google Maps).{" "}
                <a
                  href="https://apify.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Anthropic</strong>,{" "}
                <strong className="text-ink">OpenAI</strong> y{" "}
                <strong className="text-ink">Nebius</strong> (modelos de
                lenguaje LLM utilizados por los agentes internos). Los proveedores
                confirman por contrato que los datos transmitidos no se utilizan
                para entrenamiento. Politicas:{" "}
                <a
                  href="https://www.anthropic.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Anthropic
                </a>
                ,{" "}
                <a
                  href="https://openai.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  OpenAI
                </a>
                ,{" "}
                <a
                  href="https://nebius.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Nebius
                </a>
                .
              </li>
              <li>
                <strong className="text-ink">Vercel</strong> (hosting del
                frontend, CDN).{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
                >
                  Politica
                </a>
                .
              </li>
            </ul>
            <p className="mt-4">
              Tambien comunicamos datos a autoridades publicas cuando existe
              obligacion legal (Agencia Tributaria, Seguridad Social, Cuerpos y
              Fuerzas de Seguridad a requerimiento judicial).
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              6. Transferencias internacionales de datos
            </h2>
            <p>
              Algunos proveedores pueden procesar datos fuera del Espacio Economico
              Europeo (principalmente Estados Unidos): Stripe, Sentry, Apify,
              Anthropic, OpenAI, Nebius y Vapi. En todos los casos las
              transferencias se protegen mediante:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                Las <strong className="text-ink">Clausulas Contractuales
                Tipo</strong> (SCC, Standard Contractual Clauses) aprobadas por la
                Comision Europea.
              </li>
              <li>
                Medidas complementarias tecnicas y organizativas (cifrado en
                transito y reposo, segregacion logica, minimizacion de datos).
              </li>
              <li>
                Certificaciones equivalentes cuando procede (por ejemplo, el EU-US
                Data Privacy Framework cuando el proveedor esta adherido).
              </li>
            </ul>
            <p>
              El usuario puede solicitar copia de las garantias aplicables escribiendo
              a{" "}
              <a
                href="mailto:hola@pacameagencia.com"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                hola@pacameagencia.com
              </a>
              .
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              7. Plazos de conservacion
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                <strong className="text-ink">Clientes activos:</strong>{" "}
                mientras dure la relacion contractual.
              </li>
              <li>
                <strong className="text-ink">Clientes inactivos:</strong>{" "}
                hasta 5 anos tras la ultima interaccion (art. 30 del Codigo de
                Comercio y LOPDGDD para obligaciones fiscales).
              </li>
              <li>
                <strong className="text-ink">Leads de prospeccion B2B:</strong>{" "}
                hasta 2 anos desde el ultimo contacto, salvo oposicion anterior.
              </li>
              <li>
                <strong className="text-ink">Newsletter:</strong> hasta que
                el interesado revoque el consentimiento (cada email incluye enlace
                de baja).
              </li>
              <li>
                <strong className="text-ink">Solicitudes de supresion RGPD:</strong>{" "}
                los datos se eliminan en un plazo maximo de 30 dias desde la
                confirmacion, salvo que una obligacion legal obligue a conservarlos
                (en cuyo caso se bloquean).
              </li>
              <li>
                <strong className="text-ink">Logs tecnicos y seguridad:</strong>{" "}
                hasta 12 meses.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              8. Derechos del usuario
            </h2>
            <p>
              El usuario puede ejercer en cualquier momento los siguientes derechos
              reconocidos por el RGPD y la LOPDGDD:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                <strong className="text-ink">Acceso:</strong> obtener
                confirmacion y copia de los datos tratados.
              </li>
              <li>
                <strong className="text-ink">Rectificacion:</strong>{" "}
                corregir datos inexactos o incompletos.
              </li>
              <li>
                <strong className="text-ink">Supresion</strong>{" "}
                (&quot;derecho al olvido&quot;): solicitar la eliminacion cuando ya no
                sean necesarios.
              </li>
              <li>
                <strong className="text-ink">Oposicion:</strong> oponerse
                al tratamiento basado en interes legitimo o marketing directo.
              </li>
              <li>
                <strong className="text-ink">Limitacion:</strong> restringir
                el tratamiento en los supuestos del art. 18 RGPD.
              </li>
              <li>
                <strong className="text-ink">Portabilidad:</strong> recibir
                los datos en formato estructurado, de uso comun y lectura mecanica.
              </li>
              <li>
                <strong className="text-ink">
                  No ser objeto de decisiones automatizadas
                </strong>{" "}
                con efectos juridicos significativos.
              </li>
              <li>
                <strong className="text-ink">Retirada del consentimiento</strong>{" "}
                en cualquier momento, sin efectos retroactivos.
              </li>
            </ul>
            <p className="mt-4">
              Los clientes pueden gestionar buena parte de estos derechos de forma
              autonoma desde su panel:{" "}
              <Link
                href="/portal/privacy"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                /portal/privacy
              </Link>
              . Para cualquier otro caso basta con escribir a{" "}
              <a
                href="mailto:hola@pacameagencia.com"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                hola@pacameagencia.com
              </a>{" "}
              acreditando la identidad. Responderemos en un plazo maximo de 30 dias
              (prorrogable a 60 en casos complejos).
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              9. Decisiones automatizadas y elaboracion de perfiles
            </h2>
            <p>
              PACAME utiliza agentes de inteligencia artificial para tareas
              operativas: generar borradores de propuestas comerciales, calificar
              leads entrantes, redactar contenido, sugerir entregables tecnicos o
              asistir en la atencion al cliente. Es importante que el usuario sepa
              lo siguiente:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                Ninguna decision con efectos juridicos significativos o que afecte
                de forma equivalente al interesado se toma de forma totalmente
                automatizada.
              </li>
              <li>
                Pablo Calleja supervisa personalmente el output de los agentes
                antes de cualquier comunicacion relevante al cliente.
              </li>
              <li>
                Los datos transmitidos a los proveedores de LLM no se utilizan para
                entrenar sus modelos (clausula contractual explicita).
              </li>
              <li>
                El usuario tiene derecho a solicitar intervencion humana y a
                impugnar cualquier decision apoyada en IA.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              10. Cookies
            </h2>
            <p>
              El sitio utiliza cookies tecnicas, analiticas y de funcionalidad.
              Consulta el detalle completo y las opciones de configuracion en
              nuestra{" "}
              <Link
                href="/cookies"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                Politica de Cookies
              </Link>
              .
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              11. Menores de edad
            </h2>
            <p>
              Los servicios de PACAME no estan dirigidos a menores de 16 anos. No
              recabamos conscientemente datos de menores de esa edad. Si detectamos
              que un registro pertenece a un menor, procedemos a su eliminacion
              inmediata. Si un tutor tiene sospechas, puede contactar con nosotros a{" "}
              <a
                href="mailto:hola@pacameagencia.com"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                hola@pacameagencia.com
              </a>
              .
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              12. Cambios en esta politica
            </h2>
            <p>
              PACAME puede actualizar esta politica para reflejar cambios
              normativos, tecnicos u operativos. La version vigente siempre estara
              publicada en esta URL con su fecha de ultima actualizacion. Si el
              cambio es material (nuevos tratamientos, nuevos encargados relevantes,
              cambios en bases legales), notificaremos a los clientes activos por
              email con una antelacion minima de 15 dias.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              13. Reclamaciones ante la autoridad de control
            </h2>
            <p>
              Si el usuario considera que el tratamiento de sus datos no se ajusta
              a la normativa vigente, tiene derecho a presentar una reclamacion
              ante la{" "}
              <strong className="text-ink">
                Agencia Espanola de Proteccion de Datos (AEPD)
              </strong>
              , con domicilio en calle Jorge Juan 6, 28001 Madrid, o en{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                www.aepd.es
              </a>
              . Antes de acudir a la autoridad de control, agradecemos al usuario
              que intente resolver la cuestion con nosotros a traves de{" "}
              <a
                href="mailto:hola@pacameagencia.com"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                hola@pacameagencia.com
              </a>
              .
            </p>
          </section>

          {/* Cross-links */}
          <div className="pt-10 border-t border-ink/[0.06] flex flex-wrap gap-4">
            <Link
              href="/aviso-legal"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Aviso Legal
            </Link>
            <Link
              href="/terminos-servicio"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Terminos de Servicio
            </Link>
            <Link
              href="/cookies"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Cookies
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
