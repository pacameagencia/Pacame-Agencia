# PACAME Mobile — Opciones de app movil

Pablo menciono Flutter. Este documento explica por que Flutter NO encaja en el
proyecto web Next.js actual, y cuales son las 3 opciones viables si decidimos ir
a mobile.

## Por que Flutter NO encaja en Next.js PACAME

**Stack actual**: Next.js 16 + React 19 + Tailwind + TypeScript + Supabase + Stripe.

**Flutter**:
- Su toolchain (Dart) no integra con React
- Flutter web genera un bundle enorme (~2-4MB) via CanvasKit o HTML renderer
- Pierde todo el SEO del rendering React
- Duplica codigo: ninguno de los 500+ archivos tsx del proyecto sirve alla
- Requiere un proyecto hermano, no sub-route

Meter Flutter en `/app/flutter/` haria el bundle insufrible y romperia todo.

## Opcion A — Proyecto Flutter hermano (si quieres Flutter app nativa)

**Estructura propuesta:**
```
PACAME-AGENCIA/
├── web/                    ← Next.js (lo de ahora)
├── mobile-pacame/          ← Flutter app nueva (proyecto hermano)
│   ├── lib/
│   │   ├── screens/
│   │   ├── services/
│   │   └── main.dart
│   └── pubspec.yaml
└── shared/                 ← tipos + constantes compartidas
```

**Como:**
1. `flutter create mobile-pacame` en la raiz
2. Reutilizas Supabase + Stripe + Resend consumiendo las APIs de `web/app/api/`
3. Autenticacion: mismo Supabase Auth SDK disponible en Flutter
4. Push notifications via Firebase Cloud Messaging
5. Stores: Google Play + Apple App Store (Pablo necesita cuentas developer)

**Pros:**
- Native feel (Cupertino + Material)
- Bundle mobile mucho mas pequeño que PWA
- Acceso full a APIs nativas (camera, push, biometria)

**Contras:**
- 2 codebases en paralelo
- Equipo Flutter (Dart) separado del React team

## Opcion B — Expo / React Native (reusa React)

**Estructura propuesta:**
```
PACAME-AGENCIA/
├── web/            ← Next.js
├── mobile-expo/    ← Expo app
│   ├── app/
│   └── package.json
```

**Expo** te da Flutter-like DX pero en React:
- Framework: React Native + Expo Router (similar a Next.js app router)
- Push Notifications + Biometria + Camera integrado
- OTA updates (cambias codigo sin re-submit stores)
- Ya tenemos el skill `expo-deployment` instalado

**Pros:**
- Reusa ~80% de componentes React (con adaptaciones de Tailwind → NativeWind)
- Un solo equipo (frontend React)
- Skill pack instalado tiene: expo-api-routes, expo-cicd-workflows, expo-deployment, expo-dev-client, expo-module, expo-tailwind-setup

**Contras:**
- React Native no es 100% idiomatic (bridge JS ↔ native)
- Algunos packages web no tienen equivalente RN

## Opcion C — PWA + Capacitor (minimo esfuerzo)

**Ya tenemos PWA installable** (Sprint 13). Si queremos distribuir en las stores:

**Capacitor** empaqueta una PWA como app nativa:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init PACAME com.pacame.app
npx cap add android
npx cap add ios
```

Entonces la app movil ES la web con un webview — mismo codigo exacto. Se sube a
stores como aplicacion nativa.

**Pros:**
- Zero nuevo codigo — reusa el Next.js 100%
- Mismo deploy = mobile actualizada

**Contras:**
- Experience inferior a RN o Flutter (es un webview)
- Sin acceso profundo a APIs nativas (limitado a plugins Capacitor)

## Recomendacion

- **Si Pablo quiere probar mobile rapido sin invertir:** Opcion C (Capacitor).
  1 semana de setup, reusa todo, se puede descartar si no despega.
- **Si mobile va a ser core del negocio:** Opcion B (Expo/RN).
  Reusa equipo, buena DX, ecosistema probado.
- **Si hay un equipo Flutter/Dart ya:** Opcion A.

**NO RECOMIENDO Flutter web dentro del proyecto actual** — seria un sprint de
pesadilla y romperia el performance del landing.

---

**Setup recomendado (fase futura):**
Cuando decidamos, creo la estructura como sub-sprint con:
- Proyecto mobile en carpeta hermana
- APIs Supabase/Stripe/Resend reutilizadas
- Design tokens del mismo `lib/design/tokens.ts` (compartidos)
- CI/CD a stores automatizado
