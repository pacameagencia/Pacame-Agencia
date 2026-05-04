/**
 * DarkRoom · /legal/aviso-legal — Aviso Legal LSSI-CE.
 *
 * Cumple LSSI mínimo. Datos del operador con SL placeholder hasta
 * constitución. Nota explícita: nombre del administrador no publicado
 * proactivamente, solo ante autoridad o legítimo interés (regla
 * proteccion-identidad.md).
 */

import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import LegalDocument, { LegalSection, LegalP, LegalUL } from "@/components/darkroom/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso Legal · DarkRoom",
  description: "Aviso legal LSSI-CE del servicio DarkRoom.",
};

export default async function AvisoLegalPage() {
  await ensureDarkRoomHost();

  return (
    <LegalDocument
      title="Aviso Legal"
      meta="Versión 1.0 · pendiente de fecha de entrada en vigor"
    >
      <LegalSection number={1} title="Identificación del prestador del servicio">
        <LegalP>
          En cumplimiento de lo establecido en el artículo 10 de la Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los siguientes datos:
        </LegalP>
        <LegalUL>
          <li><strong>Razón social</strong>: [pendiente de completar al constituir Dark Room IO SL o sociedad operadora]</li>
          <li><strong>NIF</strong>: [pendiente]</li>
          <li><strong>Domicilio social</strong>: [pendiente — dirección registrada en Registro Mercantil]</li>
          <li><strong>Datos registrales</strong>: Inscrita en el Registro Mercantil de [provincia], Tomo X, Folio Y, Hoja [Mxxxxx].</li>
          <li><strong>Email de contacto</strong>: <code>support@darkroomcreative.cloud</code></li>
          <li><strong>Sitio web</strong>: <code>darkroomcreative.cloud</code></li>
        </LegalUL>
        <LegalP>
          Cuando la legislación vigente y la forma jurídica del prestador exijan adicionalmente la identificación nominal del administrador o representante legal, dicho dato será facilitado a la autoridad competente o a quien acredite legítimo interés mediante solicitud escrita motivada al email anterior.
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="Objeto del Aviso Legal">
        <LegalP>
          El presente aviso regula las condiciones generales de uso del sitio web <code>darkroomcreative.cloud</code> y los servicios accesibles a través del mismo (en adelante, &quot;el Sitio&quot; o &quot;el Servicio&quot;). El uso del Sitio implica la aceptación expresa y plena de los términos aquí establecidos.
        </LegalP>
        <LegalP>
          Este Aviso Legal se complementa con los siguientes documentos, que forman parte integrante del marco contractual:
        </LegalP>
        <LegalUL>
          <li><a href="/legal/terminos" style={{ color: "#A1A1AA", textDecoration: "underline" }}>Términos y Condiciones de Uso</a></li>
          <li><a href="/legal/privacidad" style={{ color: "#A1A1AA", textDecoration: "underline" }}>Política de Privacidad</a></li>
          <li><a href="/legal/cookies" style={{ color: "#A1A1AA", textDecoration: "underline" }}>Política de Cookies</a></li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={3} title="Condiciones generales de uso">
        <LegalP>
          El Usuario se compromete a hacer un uso adecuado del Sitio y de los servicios, conforme a la legalidad vigente, la moral, las buenas costumbres y el orden público, y a no utilizar el Sitio para:
        </LegalP>
        <LegalUL>
          <li>Fines o efectos ilícitos, lesivos de derechos o intereses de terceros.</li>
          <li>Realizar actividades fraudulentas o contrarias a la buena fe.</li>
          <li>Suplantar la identidad de un tercero o falsear las credenciales de acceso.</li>
          <li>Introducir o difundir virus informáticos o cualquier otro elemento técnico que pueda afectar el Sitio.</li>
          <li>Acceder, modificar o vulnerar las medidas de seguridad del Sitio.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={4} title="Propiedad intelectual e industrial">
        <LegalP>
          Todos los contenidos del Sitio (textos, imágenes, código, diseño gráfico, software, marcas, logotipos, nombres comerciales y demás elementos distintivos) son propiedad del prestador o, en su caso, de los terceros licenciantes que han autorizado su uso, y están protegidos por la normativa nacional e internacional en materia de propiedad intelectual e industrial.
        </LegalP>
        <LegalP>
          Queda expresamente prohibida la reproducción, distribución, comunicación pública, transformación o cualquier otro acto de explotación, total o parcial, de los contenidos del Sitio, sin la autorización expresa y por escrito del prestador.
        </LegalP>
        <LegalP>
          Los nombres comerciales, marcas o signos distintivos de terceros que pudieran aparecer en el Sitio son propiedad de sus respectivos titulares y se utilizan con fines descriptivos o de comparación, sin que ello implique cesión, licencia ni asociación comercial alguna.
        </LegalP>
      </LegalSection>

      <LegalSection number={5} title="Limitación de responsabilidad">
        <LegalP>
          El prestador no será responsable, en la máxima medida permitida por la ley, de:
        </LegalP>
        <LegalUL>
          <li>Los daños y perjuicios causados por interrupciones, suspensiones o cierres del Sitio o de los servicios accesibles a través del mismo.</li>
          <li>Los daños y perjuicios causados por terceros mediante intromisiones ilegítimas, fuera del control del prestador.</li>
          <li>El uso que terceros puedan hacer de la información disponible en el Sitio.</li>
          <li>La falta de veracidad, exhaustividad, exactitud o actualización de los contenidos cuando provengan de fuentes ajenas al prestador.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={6} title="Modelo de servicio &quot;membresía colectiva&quot;">
        <LegalP>
          El servicio principal ofrecido a través del Sitio se articula como <strong>membresía colectiva de servicios digitales</strong>, en los términos descritos detalladamente en los Términos y Condiciones de Uso. El prestador actúa como gestor técnico y administrativo del acceso colectivo, no como revendedor, distribuidor ni licenciatario directo de los productos individuales que pudieran formar parte de la oferta.
        </LegalP>
        <LegalP>
          El Usuario que contrata el servicio reconoce que se trata de un modelo en zona contractual gris respecto a los términos de uso de algunos proveedores subyacentes. El prestador asume el riesgo operativo de la gestión colectiva. El Usuario asume su uso individual y no compartido conforme a las condiciones aceptadas en los Términos y Condiciones.
        </LegalP>
      </LegalSection>

      <LegalSection number={7} title="Enlaces externos">
        <LegalP>
          El Sitio puede contener enlaces a sitios web de terceros sobre los que el prestador no ejerce control. El prestador no asume responsabilidad alguna por los contenidos, prácticas comerciales o políticas de privacidad de dichos sitios externos. El Usuario debe consultar las políticas y condiciones de los sitios visitados a través de tales enlaces.
        </LegalP>
      </LegalSection>

      <LegalSection number={8} title="Modificaciones del Aviso Legal">
        <LegalP>
          El prestador se reserva el derecho a modificar el presente Aviso Legal en cualquier momento. Las modificaciones se publicarán en el Sitio y entrarán en vigor desde su publicación, salvo cuando el cambio afecte a derechos del Usuario, en cuyo caso se notificará con al menos 15 días naturales de antelación.
        </LegalP>
      </LegalSection>

      <LegalSection number={9} title="Legislación aplicable y jurisdicción">
        <LegalP>
          El presente Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del uso del Sitio:
        </LegalP>
        <LegalUL>
          <li>Cuando el Usuario actúe como consumidor, las partes se someten a los juzgados y tribunales correspondientes a su domicilio.</li>
          <li>Cuando el Usuario actúe como profesional o empresa, las partes se someten a los juzgados y tribunales del domicilio social del prestador indicado en la sección 1 de este Aviso.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={10} title="Resolución alternativa de conflictos (UE ODR)">
        <LegalP>
          Conforme al artículo 14.1 del Reglamento (UE) 524/2013, se informa que la Comisión Europea pone a disposición de los consumidores la plataforma de resolución de litigios en línea: <a href="https://ec.europa.eu/consumers/odr" style={{ color: "#A1A1AA", textDecoration: "underline" }} rel="noopener noreferrer" target="_blank">ec.europa.eu/consumers/odr</a>. El Usuario puede acudir a esta plataforma para la resolución extrajudicial de litigios derivados de contratos de venta o prestación de servicios celebrados online.
        </LegalP>
      </LegalSection>

      <LegalSection number={11} title="Contacto">
        <LegalP>
          Para cualquier consulta relacionada con el presente Aviso Legal:
        </LegalP>
        <LegalUL>
          <li>Email: <code>support@darkroomcreative.cloud</code></li>
          <li>Tiempo de respuesta: 24-48 horas hábiles.</li>
        </LegalUL>
      </LegalSection>
    </LegalDocument>
  );
}
