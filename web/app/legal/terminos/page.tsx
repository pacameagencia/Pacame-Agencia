/**
 * DarkRoom · /legal/terminos — Términos y Condiciones de Uso.
 *
 * Contenido alineado con `strategy/darkroom/legal/terminos-y-condiciones.md`
 * — modelo "membresía colectiva", lenguaje legal ambiguo intencional,
 * limitación de responsabilidad, suspensión, ley aplicable.
 */

import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import LegalDocument, { LegalSection, LegalP, LegalUL } from "@/components/darkroom/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones · DarkRoom",
  description: "Condiciones de uso del servicio DarkRoom.",
};

export default async function TerminosPage() {
  await ensureDarkRoomHost();

  return (
    <LegalDocument
      title="Términos y Condiciones de Uso"
      meta="Versión 1.0 · pendiente de fecha de entrada en vigor"
    >
      <LegalSection number={1} title="Aceptación de los Términos">
        <LegalP>
          Al registrarse, contratar o utilizar de cualquier forma los servicios de <strong>Dark Room</strong> (en adelante, &quot;el Servicio&quot; o &quot;la Plataforma&quot;), accesible a través de <code>darkroomcreative.cloud</code>, el usuario (en adelante, &quot;el Miembro&quot;) declara haber leído, comprendido y aceptado en su totalidad los presentes Términos y Condiciones, así como la Política de Privacidad y la Política de Cookies que forman parte integrante de este contrato.
        </LegalP>
        <LegalP>
          Si el Miembro no está de acuerdo con cualquiera de estas cláusulas, deberá abstenerse de utilizar el Servicio.
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="Definición del Servicio">
        <LegalP>
          Dark Room es una <strong>plataforma de membresía colectiva de servicios digitales creativos</strong> que ofrece a sus Miembros acceso compartido y rotativo a un conjunto curado de recursos profesionales destinados a la productividad creativa.
        </LegalP>
        <LegalP>
          El Servicio se basa en un modelo de <strong>acceso colectivo a recursos digitales premium</strong>, en el que los costes de licenciamiento, infraestructura y mantenimiento se distribuyen entre los Miembros activos de la comunidad. Dark Room actúa como <strong>gestor técnico y administrativo</strong> del acceso colectivo, no como revendedor, distribuidor ni licenciatario directo de los productos individuales que pudieran formar parte de la oferta.
        </LegalP>
        <LegalP>
          La oferta concreta de recursos disponibles puede variar en cualquier momento sin previo aviso, en función de la disponibilidad, la demanda interna de la comunidad y las decisiones operativas de Dark Room.
        </LegalP>
      </LegalSection>

      <LegalSection number={3} title="Naturaleza Jurídica de la Membresía">
        <LegalP>
          La contratación del Servicio constituye una <strong>suscripción a una membresía colectiva</strong>, no una compra, licencia ni cesión individual de software o producto digital. El Miembro reconoce expresamente que:
        </LegalP>
        <LegalUL>
          <li>El acceso a los recursos disponibles es <strong>compartido</strong>, <strong>rotativo</strong> y está sujeto a las normas internas de uso colectivo definidas por la Plataforma.</li>
          <li>Dark Room <strong>no transfiere ni concede licencia individual</strong> sobre ningún producto de terceros, sino que coordina el acceso a recursos compartidos de la comunidad.</li>
          <li>Los productos digitales accesibles a través de la Plataforma son propiedad de sus respectivos titulares. Dark Room no reclama titularidad sobre ninguna marca, software o producto registrado por terceros.</li>
          <li>El Miembro es responsable de utilizar los recursos colectivos en estricto cumplimiento de las condiciones de uso de cada producto subyacente, en la medida en que dichas condiciones le sean directamente aplicables como usuario final individual.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={4} title="Obligaciones del Miembro">
        <LegalP>El Miembro se compromete a:</LegalP>
        <LegalUL>
          <li><strong>Uso personal e intransferible</strong>: las credenciales de acceso a la membresía son personales. No podrán ser cedidas, revendidas, divulgadas ni compartidas con terceros ajenos a la membresía.</li>
          <li><strong>Uso razonable</strong>: el acceso colectivo está diseñado para uso profesional individual o de pequeño equipo. Quedan prohibidos los patrones de uso intensivo, automatizado, masivo o destinados a la reventa de servicios derivados.</li>
          <li><strong>No responsabilidad de Dark Room por uso individual</strong>: el Miembro asume responsabilidad exclusiva por el contenido que cree, los proyectos que ejecute y los archivos que genere utilizando los recursos de la Plataforma.</li>
          <li><strong>Cumplimiento legal</strong>: el Miembro garantiza que su uso del Servicio cumple toda la legislación aplicable en su jurisdicción.</li>
          <li><strong>No autorización de uso compartido masivo</strong>: el Miembro reconoce expresamente que la membresía no le autoriza a explotar comercialmente las cuentas o recursos colectivos en beneficio de terceros no asociados a Dark Room.</li>
        </LegalUL>
      </LegalSection>

      <LegalSection number={5} title="Limitación de Responsabilidad">
        <LegalP>
          Dark Room ofrece el Servicio <strong>&quot;tal cual&quot;</strong> y <strong>&quot;según disponibilidad&quot;</strong>, sin garantías expresas o implícitas de continuidad, idoneidad para un fin particular o ausencia de errores.
        </LegalP>
        <LegalP>
          En la máxima medida permitida por la legislación aplicable, Dark Room <strong>no será responsable</strong> por:
        </LegalP>
        <LegalUL>
          <li>Interrupciones, suspensiones o terminaciones del acceso a recursos individuales que formen parte de la oferta colectiva, incluso cuando dichas interrupciones se deban a decisiones de los proveedores originales de dichos recursos.</li>
          <li>Pérdidas de datos, archivos, proyectos o trabajos derivadas del uso del Servicio.</li>
          <li>Daños directos, indirectos, incidentales, consecuentes, especiales o punitivos que pudieran derivarse del uso o imposibilidad de uso de la Plataforma.</li>
          <li>Conflictos legales, contractuales o reputacionales que el Miembro pudiera enfrentar con terceros como consecuencia del uso individual que haga de los recursos colectivos.</li>
        </LegalUL>
        <LegalP>
          La responsabilidad máxima agregada de Dark Room frente al Miembro, por cualquier causa, queda limitada al importe efectivamente abonado por éste durante los <strong>tres (3) meses inmediatamente anteriores</strong> al evento que motive la reclamación.
        </LegalP>
      </LegalSection>

      <LegalSection number={6} title="Suspensión y Terminación">
        <LegalP>
          Dark Room se reserva el derecho a <strong>suspender o terminar la membresía</strong> de forma inmediata y sin reembolso en los siguientes supuestos:
        </LegalP>
        <LegalUL>
          <li>Incumplimiento de cualquiera de las obligaciones recogidas en estos Términos.</li>
          <li>Detección de patrones de uso anómalos, automatizados o que pongan en riesgo la continuidad del acceso colectivo para el resto de Miembros.</li>
          <li>Solicitud o requerimiento legítimo de autoridad competente.</li>
          <li>Decisión operativa unilateral por motivos técnicos, legales o estratégicos, en cuyo caso se prorrateará la devolución del importe correspondiente al periodo no consumido.</li>
        </LegalUL>
        <LegalP>
          El Miembro podrá darse de baja en cualquier momento desde su panel de cuenta o solicitándolo por escrito a <code>support@darkroomcreative.cloud</code>. La baja será efectiva al final del ciclo de facturación en curso.
        </LegalP>
      </LegalSection>

      <LegalSection number={7} title="Modificaciones de los Términos">
        <LegalP>
          Dark Room podrá modificar los presentes Términos y Condiciones en cualquier momento. Las modificaciones se notificarán al Miembro a través del correo electrónico asociado a su cuenta o mediante aviso destacado en la Plataforma, con un preaviso mínimo de <strong>quince (15) días naturales</strong> antes de su entrada en vigor.
        </LegalP>
        <LegalP>
          El uso continuado del Servicio tras la entrada en vigor de las modificaciones implicará aceptación tácita de las mismas. Si el Miembro no estuviera de acuerdo, podrá darse de baja sin penalización antes de la fecha de efecto.
        </LegalP>
      </LegalSection>

      <LegalSection number={8} title="Propiedad Intelectual">
        <LegalP>
          Todos los elementos propios de la Plataforma (interfaz, marca, contenido editorial, comunicaciones, software de gestión de la membresía) son <strong>propiedad exclusiva de Dark Room</strong> y están protegidos por la legislación vigente.
        </LegalP>
        <LegalP>
          Los productos digitales de terceros accesibles a través de la membresía colectiva siguen siendo propiedad exclusiva de sus respectivos titulares. Dark Room no reclama, sugiere ni implica titularidad alguna sobre los mismos.
        </LegalP>
        <LegalP>
          El Miembro conserva la propiedad intelectual de todos los trabajos, archivos y contenidos que cree utilizando los recursos disponibles a través de la Plataforma.
        </LegalP>
      </LegalSection>

      <LegalSection number={9} title="Protección de Datos">
        <LegalP>
          El tratamiento de datos personales se rige por la <strong>Política de Privacidad</strong> de Dark Room, accesible en <a href="/legal/privacidad" style={{ color: "#A1A1AA", textDecoration: "underline" }}>darkroomcreative.cloud/legal/privacidad</a>, que el Miembro acepta expresamente al contratar el Servicio.
        </LegalP>
      </LegalSection>

      <LegalSection number={10} title="Ley Aplicable y Jurisdicción">
        <LegalP>
          Los presentes Términos y Condiciones se rigen por la legislación vigente. Para la resolución de cualquier controversia que pudiera derivarse de la interpretación o ejecución de estos Términos, las partes se someten <strong>expresamente</strong> a los juzgados y tribunales que correspondan al domicilio del Miembro consumidor, conforme a la normativa de defensa del consumidor aplicable.
        </LegalP>
        <LegalP>
          Para Miembros profesionales o empresas, las partes se someten a los juzgados y tribunales que se determinen en función del domicilio social de la entidad operadora de Dark Room, indicado en el aviso legal.
        </LegalP>
      </LegalSection>

      <LegalSection number={11} title="Aviso Legal y Datos del Operador">
        <LegalP>
          Los datos identificativos del operador del Servicio están publicados en el <a href="/legal/aviso-legal" style={{ color: "#A1A1AA", textDecoration: "underline" }}>Aviso Legal</a>, accesible permanentemente desde la Plataforma.
        </LegalP>
      </LegalSection>

      <LegalSection number={12} title="Comunicaciones">
        <LegalP>
          Toda comunicación oficial entre Dark Room y el Miembro se realizará a través de:
        </LegalP>
        <LegalUL>
          <li>Correo electrónico: <code>support@darkroomcreative.cloud</code></li>
          <li>Panel de cuenta del Miembro</li>
        </LegalUL>
        <LegalP>
          No se considerarán válidas las comunicaciones realizadas por canales distintos a los anteriormente indicados.
        </LegalP>
      </LegalSection>
    </LegalDocument>
  );
}
