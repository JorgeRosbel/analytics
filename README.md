# app-analytics

Analítica web **multi-tenant** y **sin cookies** (estilo Plausible/SimpleAnalytics), desplegable en un único **Cloudflare Worker**. Mide pageviews de tus dominios sin banner de consentimiento: no usa cookies en el visitante, no guarda IP ni user-agent, solo datos agregados (ruta, referrer, país).

**Stack:** Hono (API) + D1 (SQLite) · React 19 + Vite + Tailwind v4 + shadcn/ui + React Router + TanStack Query + zustand · Cloudflare Workers.

## Características

- 🔐 **Login por email** con JWT (access token + refresh token en cookie httpOnly). Sin registro público: los usuarios se crean por script.
- 🌐 **Gestión de dominios** por usuario (cada quien ve solo lo suyo) con snippet de tracking listo para copiar.
- 📊 **Dashboard completo**: visitantes en vivo, rango de fechas, gráfica temporal, top de rutas y referrers, países con banderas + mapa mundial, y filtros drill-down (clic para segmentar).
- 🍪 **Cookieless / GDPR-friendly**: no requiere consentimiento.

## Despliegue en 1 comando

Necesitas **Node.js**, **pnpm** y una cuenta (gratis) de **Cloudflare**. Luego:

```bash
./deploy.sh
```

El script hace todo: instala dependencias, te loguea en Cloudflare, crea la base de datos D1, aplica las migraciones, genera el secreto JWT, te pide el email/contraseña del admin y despliega. Al terminar te da la URL de tu panel. Es re-ejecutable sin romper nada.

## Desarrollo local

```bash
pnpm install
pnpm dev                 # SPA + API en http://localhost:5173 (Worker en workerd)

# Base de datos local (D1 en .wrangler/state):
pnpm db:migrate:local    # aplica migraciones
pnpm user:create tu@email.com tucontraseña   # crea un usuario (local)
```

## Crear / migrar (producción)

```bash
pnpm db:migrate:remote                                # aplica migraciones en remoto
pnpm user:create tu@email.com tucontraseña --remote   # crea usuario en remoto
pnpm run deploy                                       # build + deploy
```

> El secreto de firma JWT va en `.dev.vars` (local, **no** se commitea) como `JWT_SECRET`, y en producción se sube con `wrangler secret put JWT_SECRET`. Nunca lo pongas con prefijo `VITE_` (eso lo expondría al navegador).

## El snippet de tracking

En el dashboard, cada sitio muestra su snippet. Pégalo en el `<head>` de tu web:

```html
<script defer src="https://TU-WORKER.workers.dev/api/script.js" data-site="tudominio.com"></script>
```

Envía un beacon por cada pageview. Sin cookies, sin datos personales.

## Estructura

```
server/
├── index.ts            # ensambla la app Hono y sirve /api/script.js
├── middleware/auth.ts  # verifica el access token (Bearer)
├── routes/             # auth · sites · collect · stats
├── utils/password.ts   # hash PBKDF2 (Web Crypto)
└── types.ts            # schemas Zod + tipos compartidos
migrations/             # SQL de D1 (users, sites, events)
scripts/create-user.ts  # alta manual de usuarios
src/
├── features/           # auth · sites · stats (dashboard)
├── components/layout/   # AppLayout
├── lib/api.ts          # axios + refresh automático
├── stores/auth.ts      # estado de sesión (zustand)
└── pages/              # privacidad
```
