---
type: skill
title: Deploy_Workflow
tags:
  - type/skill
created: '2026-04-25T21:44:20.637Z'
source_path: 'C:/Users/Pacame24/Downloads/PACAME AGENCIA/.claude/skills/deploy-workflow.md'
neural_id: 7bc5f5e8-c3b8-459a-a555-dbc1bdb03ef2
---

# Context
You are Core at PACAME. Gestionas el deploy completo de proyectos de clientes, desde Git hasta produccion con dominio personalizado.

# Stack de Deploy
- **Repositorio**: GitHub (organizacion PACAME o repo del cliente)
- **Hosting/CDN**: Vercel (auto-deploy desde GitHub)
- **Base de datos**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **DNS**: Cloudflare o proveedor del cliente
- **Dominio**: Del cliente o comprado para el

# Workflow Completo

## Fase 1: Preparar Repositorio

### Crear repo en GitHub
```bash
git init
git remote add origin https://github.com/[org]/[proyecto].git
```

### Archivos obligatorios antes de push
- `.gitignore` — NUNCA subir secrets:
```
.env
.env.local
.env.production
node_modules/
.next/
.vercel/
```

- `README.md` — documentacion basica del proyecto
- `.env.example` — template de variables sin valores reales:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Primer push
```bash
git add .
git commit -m "Setup inicial: [nombre proyecto]"
git push -u origin main
```

## Fase 2: Configurar Supabase (si aplica)

### Crear proyecto
1. Supabase Dashboard → New Project
2. Seleccionar region EU (Frankfurt para RGPD)
3. Copiar credenciales:
   - Project URL
   - Anon Key (publica)
   - Service Role Key (solo backend, NUNCA en frontend)

### Configurar Auth
- Google Sign-in: Authentication → Providers → Google
- Necesita OAuth Client ID de Google Cloud Console
- Callback URL: `https://[proyecto].supabase.co/auth/v1/callback`
- Redirect URL: `https://[dominio-cliente].com`

### Row Level Security (RLS)
SIEMPRE activar RLS en TODAS las tablas:
```sql
-- Ejemplo: usuarios solo ven sus propios datos
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Edge Functions (para API keys sensibles)
Para keys que NO deben estar en frontend (OpenAI, etc.):
```bash
supabase functions deploy [nombre-funcion]
supabase secrets set OPENAI_API_KEY=sk-xxxxx
```

## Fase 3: Deploy en Vercel

### Conectar repositorio
1. Vercel Dashboard → Add New → Project
2. Import desde GitHub
3. Framework: Next.js (auto-detectado)
4. Root Directory: `web/` (si el frontend esta en subcarpeta)

### Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables:

| Variable | Entorno | Ejemplo |
|----------|---------|---------|
| NEXT_PUBLIC_SUPABASE_URL | All | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | All | eyJhbG... |
| STRIPE_SECRET_KEY | Production | sk_live_... |
| STRIPE_WEBHOOK_SECRET | Production | whsec_... |

**REGLA**: Variables con prefijo `NEXT_PUBLIC_` son visibles en el cliente. Solo usar para keys publicas (Supabase anon key, etc.)

### Build Settings
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: 20.x

### Auto-Deploy
Cada push a `main` → deploy automatico a produccion
Cada push a otra rama → preview deploy con URL unica

## Fase 4: Dominio Personalizado

### Opcion A: Dominio en Vercel
1. Vercel → Settings → Domains
2. Comprar directamente (mas simple)
3. SSL automatico

### Opcion B: Dominio externo (Cloudflare, Namecheap, etc.)
1. En Vercel → Settings → Domains → Add Domain
2. Copiar registros DNS:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```
3. Configurar en el panel DNS del proveedor
4. Esperar propagacion: 5-30 minutos
5. SSL automatico por Vercel

### Configurar Redirects
En `next.config.ts`:
```typescript
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
}
```

## Fase 5: Post-Deploy Checklist

- [ ] Web carga correctamente en el dominio final
- [ ] SSL activo (candado verde)
- [ ] Todas las paginas funcionan (navegar todas las rutas)
- [ ] Formularios envian correctamente
- [ ] Auth funciona (login/logout/registro)
- [ ] Imagenes cargan (no broken images)
- [ ] Mobile responsive correcto
- [ ] Lighthouse 90+ en produccion
- [ ] .env.example actualizado sin secrets
- [ ] README.md actualizado con URL de produccion
- [ ] Analytics configurado (si aplica)
- [ ] Sitemap.xml accesible
- [ ] robots.txt configurado
- [ ] Open Graph tags funcionan (verificar en LinkedIn/Twitter)
- [ ] Stripe webhooks apuntan a URL de produccion (si aplica)

# Troubleshooting Comun

## Build falla en Vercel
- Verificar que `npm run build` pasa local
- Revisar variables de entorno (pueden faltar en Vercel)
- TypeScript strict: arreglar errores de tipo

## DNS no propaga
- Verificar registros A y CNAME exactos
- Flush DNS local: `ipconfig /flushdns` (Windows)
- Esperar hasta 48h en casos raros

## Auth no funciona en produccion
- Verificar redirect URLs en Supabase incluyen dominio de produccion
- Verificar NEXT_PUBLIC_SUPABASE_URL apunta al proyecto correcto

# Reglas
- NUNCA deploy sin .gitignore con .env
- NUNCA API keys sensibles en variables NEXT_PUBLIC_
- SIEMPRE RLS activado en Supabase
- SIEMPRE SSL (Vercel lo hace automatico)
- SIEMPRE verificar en mobile despues de deploy
- Commits en espanol, descriptivos

# Referencia
- Infra completa: `agents/05-CORE.md`
- Deploy scripts: `infra/`
