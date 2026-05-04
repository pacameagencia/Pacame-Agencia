/**
 * DarkRoom · /legal/privacidad — Política de Privacidad v2.
 *
 * 25 secciones RGPD-compliant + LSSI. El "Responsable del tratamiento" está
 * deliberadamente en la SECCIÓN 14, no en la 1, conforme a
 * `proteccion-identidad.md` regla 2 (datos legales diluidos, no destacados).
 */

import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import LegalDocument, {
  LegalSection,
  LegalP,
  LegalUL,
  LegalTable,
} from "@/components/darkroom/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad · DarkRoom",
  description: "Política de privacidad RGPD del servicio DarkRoom.",
};

export default async function PrivacidadPage() {
  await ensureDarkRoomHost();

  return (
    <LegalDocument
      title="Política de Privacidad"
      meta="Versión 2.0 · pendiente de fecha de entrada en vigor"
    >
      <LegalSection number={1} title="Objeto del documento">
        <LegalP>
          La presente Política de Privacidad regula el tratamiento de datos personales que se realiza a través del Servicio &quot;Dark Room&quot;, accesible en <code>darkroomcreative.cloud</code> y sus subdominios. Define las categorías de datos, las finalidades, las bases jurídicas, los plazos de conservación, los derechos del Usuario y los procedimientos para ejercerlos, en conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
        </LegalP>
        <LegalP>
          Esta política forma parte integrante del marco contractual del Servicio. La presente versión sustituye y deroga cualquier versión anterior.
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="Definiciones aplicables">
        <LegalUL>
          <li><strong>&quot;Datos Personales&quot;</strong>: toda información sobre una persona física identificada o identificable (art. 4.1 RGPD).</li>
          <li><strong>&quot;Tratamiento&quot;</strong>: cualquier operación realizada sobre Datos Personales (art. 4.2 RGPD).</li>
          <li><strong>&quot;Responsable del tratamiento&quot;</strong>: la persona física o jurídica que determina los fines y medios.</li>
          <li><strong>&quot;Encargado del tratamiento&quot;</strong>: la persona física o jurídica que trate Datos Personales por cuenta del Responsable.</li>
          <li><strong>&quot;Usuario&quot;</strong> o <strong>&quot;Miembro&quot;</strong>: persona física que utiliza la Plataforma.</li>
          <li><strong>&quot;Servicio&quot;</strong>: el conjunto de funcionalidades ofrecidas a través de la Plataforma.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={3} title="Aceptación">
        <LegalP>
          El uso del Servicio implica la aceptación expresa de esta Política. La aceptación se manifiesta mediante la marcación de la casilla correspondiente al registro o por uso continuado.
        </LegalP>
      </LegalSection>

      <LegalSection number={4} title="Ámbito de aplicación">
        <LegalP>Esta política aplica al tratamiento de datos realizado a través de:</LegalP>
        <LegalUL>
          <li>La Plataforma <code>darkroomcreative.cloud</code> y subdominios.</li>
          <li>Las herramientas conexas (paletas, comparador alternatives, hooks, prompts, mockups y aplicaciones gratuitas o freemium asociadas).</li>
          <li>Las comunicaciones electrónicas (canales oficiales, bots y números asociados al Servicio).</li>
          <li>Los formularios de contacto, registro, contratación o aplicación a programas asociados (incluido &quot;DarkRoom Crew&quot;).</li>
        </LegalUL>
        <LegalP>
          No aplica al tratamiento realizado por terceros sobre los que el Responsable no tiene control.
        </LegalP>
      </LegalSection>

      <LegalSection number={5} title="Categorías de datos personales que tratamos">
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>5.1 Datos de identificación</h3>
        <LegalUL>
          <li>Nombre y apellidos.</li>
          <li>Dirección de correo electrónico.</li>
          <li>Datos de facturación (NIF, NIE, dirección postal cuando proceda).</li>
        </LegalUL>

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>5.2 Datos de pago</h3>
        <LegalP>
          Procesados directamente por proveedores de pago (Stripe). El Responsable no almacena en sus sistemas datos completos de tarjetas; conserva únicamente identificador interno de cliente Stripe y los últimos 4 dígitos del medio de pago para soporte y fraude.
        </LegalP>

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>5.3 Datos de uso</h3>
        <LegalUL>
          <li>Logs técnicos (timestamp, IP enmascarada o hasheada, user-agent).</li>
          <li>Patrones agregados de uso, sin contenido del trabajo creativo del Usuario.</li>
          <li>Cookies técnicas y, en su caso, de analítica.</li>
        </LegalUL>

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>5.4 Datos de comunicación</h3>
        <LegalUL>
          <li>Tickets de soporte enviados a <code>support@darkroomcreative.cloud</code>.</li>
          <li>Mensajes intercambiados con bots oficiales (Telegram, WhatsApp, Instagram Direct).</li>
          <li>Respuestas voluntarias a encuestas o solicitudes de feedback.</li>
        </LegalUL>

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>5.5 Datos del programa DarkRoom Crew</h3>
        <LegalUL>
          <li>Datos de identificación bancaria (IBAN/PayPal) para procesar comisiones.</li>
          <li>Identificadores en redes sociales (handle público, link al canal).</li>
          <li>Tamaño aproximado de audiencia (declarado por el Usuario).</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={6} title="Datos que NO recopilamos">
        <LegalP>El Responsable no recopila ni trata:</LegalP>
        <LegalUL>
          <li>Datos sensibles del art. 9 RGPD (salud, ideología, orientación sexual, etc.).</li>
          <li>Datos biométricos.</li>
          <li>Contenido del trabajo creativo del Usuario (los archivos cargados se procesan en el navegador o se descartan en máximo 24 horas).</li>
          <li>Datos de geolocalización precisa.</li>
          <li>Listas de contactos del dispositivo, calendario o fotos.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={7} title="Finalidades del tratamiento">
        <LegalTable
          headers={["#", "Finalidad", "Base jurídica"]}
          rows={[
            ["1", "Prestación del Servicio de membresía colectiva", "Ejecución de contrato (art. 6.1.b RGPD)"],
            ["2", "Gestión de cobros, facturación y obligaciones fiscales", "Obligación legal (art. 6.1.c RGPD)"],
            ["3", "Atención al cliente y soporte técnico", "Ejecución de contrato"],
            ["4", "Mejora del servicio y análisis agregado de uso", "Interés legítimo (art. 6.1.f RGPD)"],
            ["5", "Detección de uso fraudulento o abusivo", "Interés legítimo + protección del resto"],
            ["6", "Comunicaciones operativas (incidencias, cambios contractuales)", "Ejecución de contrato"],
            ["7", "Comunicaciones comerciales propias y newsletters", "Consentimiento (revocable)"],
            ["8", "Gestión del programa DarkRoom Crew (comisiones, payouts)", "Ejecución de contrato + Consentimiento"],
            ["9", "Cumplimiento de requerimientos legales o de autoridad", "Obligación legal"],
            ["10", "Análisis estadísticos anonimizados", "Interés legítimo"],
          ]}
        />
      </LegalSection>

      <LegalSection number={8} title="Decisiones automatizadas y elaboración de perfiles">
        <LegalP>
          El Responsable utiliza sistemas automatizados (incluidos modelos de inteligencia artificial) en contextos limitados:
        </LegalP>
        <LegalUL>
          <li>Atención inicial al Usuario mediante bots conversacionales.</li>
          <li>Detección de patrones anómalos de uso del Servicio.</li>
        </LegalUL>
        <LegalP>
          En ningún caso el tratamiento automatizado produce efectos jurídicos significativos sobre el Usuario sin intervención humana. El Usuario puede solicitar siempre la intervención humana mediante <code>support@darkroomcreative.cloud</code>.
        </LegalP>
      </LegalSection>

      <LegalSection number={9} title="Plazos de conservación">
        <LegalTable
          headers={["Categoría", "Plazo"]}
          rows={[
            ["Datos de identificación y facturación de Miembros activos", "Vigencia del contrato + 6 años (obligación fiscal/mercantil)"],
            ["Datos de pago (referencias Stripe)", "Vigencia + 6 años"],
            ["Datos de Miembros que cancelan", "6 años desde la cancelación"],
            ["Logs técnicos completos", "90 días, después se anonimizan en agregados"],
            ["Tickets de soporte", "24 meses tras cierre del ticket"],
            ["Datos de marketing (consentimiento)", "Hasta revocación expresa"],
            ["Datos del programa Crew", "Actividad + 6 años (obligación fiscal/mercantil)"],
            ["Usuarios visitantes que no se convierten", "12 meses tras la última interacción"],
          ]}
        />
        <LegalP>
          Vencidos los plazos, los datos serán suprimidos o anonimizados de forma irreversible.
        </LegalP>
      </LegalSection>

      <LegalSection number={10} title="Encargados de tratamiento">
        <LegalP>
          Los Datos Personales pueden ser tratados por los siguientes encargados, vinculados por contratos del art. 28 RGPD:
        </LegalP>
        <LegalTable
          headers={["Encargado", "Servicio prestado", "Ubicación principal"]}
          rows={[
            ["Stripe Payments Europe Ltd.", "Procesamiento de pagos", "Irlanda + EE.UU. (SCC)"],
            ["Supabase Inc.", "Base de datos y autenticación", "Frankfurt, Alemania (UE)"],
            ["Vercel Inc.", "Hosting de la plataforma web", "Global (CDN edge)"],
            ["Resend Inc.", "Envío de correos transaccionales", "UE + EE.UU. (SCC)"],
            ["Anthropic PBC", "Procesamiento de mensajes en bots conversacionales", "EE.UU. (SCC)"],
            ["Cloudflare Inc.", "Protección DDoS + CDN", "Global"],
            ["Plausible Insights OÜ", "Analítica web anonimizada", "Estonia (UE)"],
          ]}
        />
        <LegalP>
          <strong>El Responsable no comparte ni vende Datos Personales a terceros con fines comerciales.</strong>
        </LegalP>
      </LegalSection>

      <LegalSection number={11} title="Transferencias internacionales">
        <LegalP>
          Algunos encargados pueden procesar datos fuera del Espacio Económico Europeo. Estas transferencias se amparan en:
        </LegalP>
        <LegalUL>
          <li><strong>Cláusulas Contractuales Tipo (SCC)</strong> aprobadas por la Comisión Europea (Decisión 2021/914).</li>
          <li><strong>Decisiones de adecuación</strong> (ej. EU-US Data Privacy Framework para encargados certificados).</li>
          <li><strong>Medidas suplementarias</strong> de cifrado en tránsito (TLS 1.3) y en reposo.</li>
        </LegalUL>
        <LegalP>
          El Usuario puede solicitar copia de las cláusulas contractuales tipo aplicables en <code>support@darkroomcreative.cloud</code>.
        </LegalP>
      </LegalSection>

      <LegalSection number={12} title="Derechos del Usuario">
        <LegalP>
          Conforme a los arts. 15-22 RGPD y la LOPDGDD, el Usuario tiene los siguientes derechos:
        </LegalP>
        <LegalUL>
          <li><strong>Acceso</strong>, <strong>rectificación</strong>, <strong>supresión</strong> (&quot;derecho al olvido&quot;).</li>
          <li><strong>Limitación</strong> y <strong>oposición</strong> al tratamiento basado en interés legítimo.</li>
          <li><strong>Portabilidad</strong> de los datos en formato estructurado.</li>
          <li><strong>No ser objeto de decisiones automatizadas</strong> con efectos jurídicos significativos.</li>
          <li><strong>Retirar el consentimiento</strong> prestado en cualquier momento.</li>
          <li><strong>Reclamación ante la autoridad de control</strong> (AEPD).</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={13} title="Cómo ejercer los derechos">
        <LegalP>
          El Usuario puede dirigir comunicación escrita a:
        </LegalP>
        <LegalUL>
          <li>Email: <code>support@darkroomcreative.cloud</code></li>
          <li>Asunto recomendado: &quot;Ejercicio de derecho [acceso / rectificación / supresión / etc.] – RGPD&quot;</li>
          <li>Documentación: copia escaneada de un documento identificativo válido (DNI, NIE, pasaporte) para acreditar la identidad del solicitante.</li>
        </LegalUL>
        <LegalP>
          El Responsable responderá en el plazo máximo de <strong>un (1) mes</strong>. Este plazo podrá prorrogarse por dos (2) meses adicionales en casos de especial complejidad.
        </LegalP>
        <LegalP>
          Si el Usuario considera que no ha obtenido satisfacción adecuada, podrá presentar reclamación ante la Agencia Española de Protección de Datos.
        </LegalP>
      </LegalSection>

      <LegalSection number={14} title="Responsable del tratamiento">
        <LegalP>
          A los efectos del art. 13.1 RGPD, los datos identificativos del Responsable del tratamiento son los siguientes:
        </LegalP>
        <LegalUL>
          <li><strong>Razón social</strong>: [pendiente de completar al constituir Dark Room IO SL o sociedad operadora]</li>
          <li><strong>NIF</strong>: [pendiente]</li>
          <li><strong>Domicilio social</strong>: [pendiente — dirección registrada en Registro Mercantil]</li>
          <li><strong>Inscripción registral</strong>: Inscrita en el Registro Mercantil de [provincia], Tomo X, Folio Y, Hoja [Mxxxxx].</li>
          <li><strong>Email de contacto general</strong>: <code>support@darkroomcreative.cloud</code></li>
          <li><strong>Email para asuntos de protección de datos</strong>: <code>support@darkroomcreative.cloud</code> (Asunto: &quot;RGPD&quot;)</li>
        </LegalUL>
        <LegalP>
          Cuando la legislación vigente y la forma jurídica del Responsable lo exijan, los datos del administrador único o representante legal podrán ser facilitados a la autoridad competente o al Usuario que acredite legítimo interés mediante solicitud escrita motivada al email anterior. Estos datos no se publican proactivamente en la web por cumplir con los principios de minimización de datos del art. 5.1.c RGPD.
        </LegalP>
      </LegalSection>

      <LegalSection number={15} title="Delegado de Protección de Datos (DPO)">
        <LegalP>
          Conforme al art. 37 RGPD, el Responsable evalúa periódicamente la obligación de designar un Delegado de Protección de Datos. Para consultas relacionadas con protección de datos: <code>support@darkroomcreative.cloud</code> (Asunto: &quot;DPO&quot;).
        </LegalP>
      </LegalSection>

      <LegalSection number={16} title="Medidas de seguridad técnicas y organizativas">
        <LegalUL>
          <li>Cifrado en tránsito mediante HTTPS/TLS 1.3 obligatorio.</li>
          <li>Cifrado en reposo de la base de datos (AES-256).</li>
          <li>Control de acceso basado en roles (RBAC) y autenticación reforzada para personal interno.</li>
          <li>Logs de auditoría para accesos sensibles.</li>
          <li>Aislamiento lógico de la infraestructura del Servicio.</li>
          <li>Plan de respuesta ante incidentes de seguridad.</li>
          <li>Revisión periódica de los encargados de tratamiento.</li>
          <li>Formación interna sobre protección de datos del personal con acceso.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={17} title="Notificación de brechas de seguridad">
        <LegalP>
          En caso de brecha que afecte a Datos Personales, el Responsable notificará a la AEPD en el plazo máximo de 72 horas desde su conocimiento (art. 33 RGPD), salvo que sea improbable que constituya un riesgo para los derechos y libertades.
        </LegalP>
        <LegalP>
          Cuando la brecha entrañe un alto riesgo, el Responsable comunicará la brecha a los Usuarios afectados sin dilación indebida (art. 34 RGPD).
        </LegalP>
      </LegalSection>

      <LegalSection number={18} title="Menores de edad">
        <LegalP>
          El Servicio está dirigido <strong>exclusivamente a personas mayores de 18 años</strong>. El Responsable no recopila ni trata conscientemente Datos Personales de menores. Si se detecta que un Usuario es menor, se procederá a la suspensión inmediata de la cuenta y supresión de datos.
        </LegalP>
      </LegalSection>

      <LegalSection number={19} title="Cookies y tecnologías similares">
        <LegalP>
          El uso de cookies se rige por la <a href="/legal/cookies" style={{ color: "#A1A1AA", textDecoration: "underline" }}>Política de Cookies</a>, que el Usuario acepta junto con la presente.
        </LegalP>
      </LegalSection>

      <LegalSection number={20} title="Enlaces a sitios web de terceros">
        <LegalP>
          La Plataforma puede contener enlaces a sitios web de terceros sobre los que el Responsable no ejerce control. El Responsable no es responsable de las prácticas de privacidad de dichos terceros.
        </LegalP>
      </LegalSection>

      <LegalSection number={21} title="Modificaciones de la Política">
        <LegalP>
          El Responsable podrá modificar esta Política. Las modificaciones sustanciales se notificarán al Usuario:
        </LegalP>
        <LegalUL>
          <li>Mediante correo electrónico al email asociado a su cuenta.</li>
          <li>Mediante aviso destacado en la Plataforma.</li>
          <li>Con un preaviso mínimo de <strong>quince (15) días naturales</strong> antes de su entrada en vigor.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={22} title="Idioma de la Política">
        <LegalP>
          La presente Política se redacta en español como idioma original y vinculante. Cualquier traducción se proporciona a título informativo.
        </LegalP>
      </LegalSection>

      <LegalSection number={23} title="Independencia de cláusulas">
        <LegalP>
          Si alguna disposición fuera declarada nula o inaplicable, dicha declaración no afectará a la validez del resto de disposiciones, que continuarán en vigor.
        </LegalP>
      </LegalSection>

      <LegalSection number={24} title="Resolución de disputas y jurisdicción">
        <LegalUL>
          <li>El Usuario consumidor podrá someter la disputa a los juzgados y tribunales correspondientes a su domicilio.</li>
          <li>Cuando el Usuario actúe como profesional o empresa, las partes se someten a los juzgados y tribunales del domicilio social del Responsable indicado en la sección 14.</li>
          <li>Posibilidad de presentar reclamación ante la AEPD sin necesidad de agotar otras vías.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={25} title="Contacto y reclamaciones ante la AEPD">
        <LegalUL>
          <li>Email: <code>support@darkroomcreative.cloud</code></li>
          <li>Autoridad de control: Agencia Española de Protección de Datos, C/ Jorge Juan, 6, 28001 Madrid. Web: <code>www.aepd.es</code>. Sede electrónica: <code>sedeagpd.gob.es</code>.</li>
        </LegalUL>
      </LegalSection>
    </LegalDocument>
  );
}
