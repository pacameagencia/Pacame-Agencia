# M2.L9 — Trabajo en equipo · Figma libraries + Drive shared

> **Dura**: 10 min
> **Nivel progreso**: 31% → 33%
> **Requisito previo**: M2.L8

## Qué vas a sacar de aquí

Compartes archivos con cliente o colaborador sin caos de versiones. Sabes la diferencia entre Figma Library + Google Drive + WeTransfer. Cobras +20% en proyectos largo plazo porque el cliente nota el orden.

## El concepto (1 idea, no 5)

Trabajar solo: tu carpeta + Photoshop + un cliente final. Sencillo.

Trabajar con cliente que revisa o equipo: necesitas **3 capas**:

1. **Diseño en vivo (Figma)** · cliente revisa con un link, deja comentarios, ve cambios en tiempo real. Sin enviar JPG por WhatsApp 30 veces.
2. **Assets compartidos (Google Drive o Dropbox)** · fotos cliente, PSD finales, exports. Permisos por carpeta.
3. **Entregables limpios (WeTransfer o link Drive)** · cuando entregas final, ZIP con archivos firmados versión y fecha.

Cada capa tiene su uso. Si mezclas (mandar Figma como ZIP, subir RAW cliente a Figma), pierdes tiempo.

## El ejemplo real

**Caso · proyecto branding 4 semanas con cliente que revisa cada viernes**

Setup:

**Lunes semana 1** · Setup inicial
- Crea archivo Figma `ClienteNombre - Brand v1` en team folder Dark Academy.
- Permiso "view" para email del cliente.
- Crea carpeta Drive `/ClienteNombre/` con subcarpetas `01-brief / 02-recursos-cliente / 03-trabajo / 04-entregables`.
- Permiso "edit" a tu colaborador (si lo hay) · "view" a cliente en `04-entregables`.

**Viernes semana 1-3** · Revisión semanal
- Cliente entra a Figma link → deja comentarios en frame específico (clic + escribir).
- Tú respondes desde tu app Figma (notificación móvil).
- Cero archivos enviados por WhatsApp.

**Viernes semana 4** · Entrega
- Crea Figma `Library`: convierte components clave en library compartible · publica.
- Drive `04-entregables/v-final/` · ZIP con: logos SVG + paleta + tipografías + mockups + brand book PDF.
- Comparte link Drive con cliente.
- WeTransfer NO usado (es para ad-hoc, no para final entrega trackeable).

## El prompt copiable

Permisos Figma cuando compartes con cliente (3 niveles):

```
View only          · cliente final · solo ve, comenta
Edit               · colaborador interno · puede mover, editar
Edit + Library     · colaborador equipo · puede crear components compartidos
```

NUNCA des "edit" al cliente final. Mueve un layer sin querer y rompe la maquetación de la pieza que llevas 4 horas.

## El segundo prompt copiable · Naming versiones

Cuando tengas un archivo más de una vez:

```
✅ Bien:
   ClienteX-LogoFinal-2026-05-15-v3.svg
   ClienteX-Web-Hero-FINAL.psd
   ClienteX-Mockup-iPhone-v2-aprobado.png

❌ Mal:
   logo.svg
   logo final.svg
   logo final final.svg
   logo final final FINAL OK.svg
```

La fecha y la versión en el nombre evita confusión. Cuando el cliente vuelve en 6 meses y dice "el logo que aprobamos", tú sabes cuál es porque la versión está en el nombre.

## Tu ejercicio (5 min)

Si tienes 1 proyecto activo (real o ficticio):

- [ ] Crea archivo Figma con permiso "view" para tu segundo email (simula cliente).
- [ ] Crea carpeta Drive con 4 subcarpetas como el ejemplo.
- [ ] Renombra 3 archivos en tu Descargas con el formato `Cliente-Asset-Fecha-Version`.

Cuando entres a un proyecto real con cliente, esos 3 minutos de setup ahorran 4 horas de caos en semana 3.

## Quick-win

**Regla "el WhatsApp es para hablar, no para entregar"**: si te entregaron un brief por WhatsApp, transcríbelo a `brief.md` en su carpeta inmediatamente. WhatsApp se pierde, se borra, se mueve. Archivo Markdown se queda.

## Si quieres profundizar

- [ ] M2.L10 · Workflow completo · brief → edición → entrega cliente
- [ ] Lead magnet M2 · 50 atajos Photoshop + Figma + Canva (PDF)
- [ ] [Figma Team Library docs](https://help.figma.com/hc/en-us/articles/360038746334) (oficial)

---

**Visual**: `TODO: visual · brief: "diagrama 3 capas verticales · Figma (diseño live) + Drive (assets shared) + WeTransfer/Drive (entregable final) · cada capa con icono y descripción · fondo dark + acento dorado en cada capa"`

**Quiz check**:
- Pregunta: "Cliente pregunta cuál es la última versión del logo en WhatsApp. ¿Qué le mandas?"
- Opciones: La última imagen del chat · Link Drive a `04-entregables/v-final/` · El PSD por WhatsApp · "Búscalo en tu chat".
- Correcta: Link Drive a `04-entregables/v-final/`.
- Explicación: WhatsApp se desordena. Drive con carpeta final mantiene una versión canónica que cualquier parte puede consultar siempre.

<!-- VISUAL_PENDIENTE -->
