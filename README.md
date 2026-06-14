# Nombre del Proyecto

Stack: React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui + React Router

## Estructura del Proyecto

```
src/
├── components/
│   └── ui/              # Componentes shadcn/ui
├── hooks/               # Custom hooks
├── lib/
│   └── utils.ts         # Utilidades (cn - class merger)
├── providers/           # Providers (QueryClient, Router) - si elegiste API
├── styles/
│   └── globals.css      # Estilos globales Tailwind
├── App.tsx              # Componente principal
└── main.tsx            # Entry point
```

## Comandos Disponibles

| Comando        | Descripcion                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | Iniciar servidor de desarrollo |
| `pnpm build`   | Compilar para produccion       |
| `pnpm lint`    | Ejecutar ESLint                |
| `pnpm format`  | Formatear con Prettier         |
| `pnpm check`   | Verificar formato              |
| `pnpm preview` | Previsualizar build            |

## Dependencias Principales

### Produccion

- **React 19** + React DOM
- **React Router DOM** - Enrutamiento
- **Zustand** - Estado global
- **shadcn/ui** - Componentes UI (Radix primitives)
- **Tailwind v4** + **tailwind-merge** + **clsx**
- **Lucide React** - Iconos
- **tw-animate-css** - Animaciones

### Opcional (si elegiste API)

- **@tanstack/react-query** - Data fetching
- **Axios** - Cliente HTTP
- **JWT Decode** - Decodificar tokens
- **Zod** - Validacion de schemas
- **http-sentinel** - Manejo de Headers

### Desarrollo

- **TypeScript** (strict mode)
- **Tailwind CSS** + **@tailwindcss/vite**
- **ESLint** + **Prettier**
- **lint-staged** + **Husky** (git hooks)

## Componentes shadcn/ui Instalados

`button`, `input`, `label`, `card`, `dialog`, `form`, `select`, `textarea`, `badge`, `avatar`, `dropdown-menu`, `separator`, `skeleton`, `tooltip`

Para agregar mas:

```bash
pnpm dlx shadcn@latest add <componente>
```

## pnpm-workspace

El proyecto usa `pnpm-workspace.yaml` con:

- **minimumReleaseAge: 4320** (3 dias) - Los paquetes se consideran "released" despues de 3 dias
- **ignoredBuiltDependencies: esbuild** - Ignora advertencias de esbuild

Este workspace permite gestionar multiples paquetes si decides agregar librerias internas.

## Conventional Commits

El proyecto incluye configuracion de commits convencionales en `.opencode/commands/commit.md`.

### Formato

`:<emoji>: <type>: <description>`

### Tipos

| Tipo       | Cuando usar          |
| ---------- | -------------------- |
| `feat`     | Nueva funcionalidad  |
| `fix`      | Correccion de bug    |
| `refactor` | Refactorizacion      |
| `style`    | Estilos CSS          |
| `docs`     | Documentacion        |
| `test`     | Tests                |
| `chore`    | Tareas mantenimiento |

### Ejemplos

- `:tada: feat: add password reset flow`
- `:bug: fix: prevent infinite reload`
- `:lipstick: style: update button hover`

## GitHub Actions (Deployment)

Workflow de deployment via FTP configurado en `.github/workflows/deploy.yml`.

**Para activar:**

1. Descomenta las lineas del workflow
2. Configura secrets en GitHub:
   - `FTP_SERVER`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`
   - `FTP_PORT`

## Variables de Entorno

```bash
.env              # Desarrollo
.env.production   # Produccion
```

Por defecto configurado para:

- `VITE_LOGIN_ENDPOINT` - Endpoint de autenticacion

## Primera Semana - Checklist

### Dia 1-2: Configuracion

- [ ] Ejecutar `pnpm install` si no se hizo
- [ ] Ejecutar `pnpm dev` y verificar que funcione
- [ ] Revisar estructura de archivos
- [ ] Familiarizarse con los componentes shadcn instalados

### Dia 3-4: Personalizacion

- [ ] Configurar theme en `src/styles/globals.css`
- [ ] Ajustar colores en las variables CSS (":root" y ".dark")
- [ ] Modificar componentes shadcn si es necesario
- [ ] Configurar meta tags en `src/components/ui/metadata-seo.tsx`

### Dia 5: Routing

- [ ] Definir rutas en `App.tsx` (si usas router)
- [ ] Crear paginas/base
- [ ] Configurar protected routes si necesitas autenticacion

### Dia 6-7: API (si aplica)

- [ ] Configurar axios con interceptors
- [ ] Definir servicios API
- [ ] Implementar queries/mutations con TanStack Query
- [ ] Integrar Zod para validacion

## Consejos

1. **No borres el codigo inicial** - Deja un commit base antes de hacer cambios grandes
2. **Usa el CLI para agregar shadcn** - Mantiene la consistencia
3. **Tailwind v4 usa @theme** - No es el mismo approach que v3
4. **Zustand para estado global** - Mas simple que Redux
5. **Consulta `src/lib/utils.ts`** - Contains the `cn()` helper for class merging

---

Generated with @jorgedevreact CLI
