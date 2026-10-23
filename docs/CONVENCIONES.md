# Convenciones del proyecto

Reglas de arquitectura. Varias las hace cumplir ESLint (`pnpm lint`), las marcadas con 🔒.

## 1. Modularidad

- Cada lógica vive en **su carpeta de módulo**, con un **archivo padre** que importa a los hijos.
- 🔒 **De otro módulo solo se importa su archivo padre** (`<modulo>.module.ts` o `index.ts`), nunca archivos internos. Regla local: `eslint-rules/module-boundaries.mjs`.
- 🔒 **Máximo 600 líneas por archivo.** Si crece, se parte en mini archivos dentro del módulo.
- Componentes con poca lógica; la lógica va en `hooks/` y `services/` del módulo.

## 2. Backend (`apps/api/src/modules/<modulo>/`)

```
<modulo>/
  <modulo>.module.ts        # padre
  <modulo>.controller.ts    # delgado: llama al service y responde lo que dice
  <modulo>.resolver.ts      # solo si hay GraphQL; igual de delgado
  dto/                      # = FormRequest: toda la validación vive aquí
  services/
    <modulo>.service.ts     # fachada: delega en los hijos
    <accion>.service.ts     # un archivo por acción (login, register, two-factor...)
  jobs/                     # solo llaman a UN service
  commands/                 # solo llaman a UN service
  tests/
```

- Controller: **cero lógica**. Validación: **solo** en DTO. Lógica: **solo** en services.
- Job o command = una llamada a un service.
- Los DTO **nunca** aceptan `userId`, `role`, `ownerId`, `agencyId` ni campos internos: el usuario sale del token.

### Rutas

```
src/routes/index.ts          # índice: importa los grupos
src/routes/api.routes.ts     # grupo /api: importa los archivos de cada módulo
src/routes/<modulo>.routes.ts
```

Para agregar un módulo: crear su `routes/<modulo>.routes.ts`, importarlo en `api.routes.ts` y su módulo en `app.module.ts`.

## 3. Frontend (`apps/web/src/modules/<modulo>/`)

```
<modulo>/
  index.ts          # padre: único punto de entrada del módulo
  components/       # poca lógica
  hooks/            # lógica de UI
  services/         # llamadas al API (+ index.ts)
  schemas/          # Zod
  types/
```

- Las páginas de `app/` solo importan desde `@/modules/<modulo>`.

## 3b. Cómo está organizado el frontend de pantallas

- Una pantalla = carpeta `<Pantalla>/` con el componente, sus partes con nombre (ej. `HomeIntro`, `HomeListings`) y su `.css`; la lógica va en `hooks/use<Pantalla>.ts`. Guía completa: `docs/GUIA-FRONTEND.md`.
- Iconos: siempre `<Icon name="..." />` (`components/icons`). Barra lateral y de pestañas de la inmobiliaria: `AgencySidebar` y `AgencyTabBar`.
- Escritorio y móvil se alternan con `<Responsive>` (o `<ClientResponsive>` si la pantalla pesa, como el mapa); el tema (color de marca y modo noche) vive en `app/globals.css`.
- Los hooks traen datos de ejemplo y `// @ts-nocheck`; al conectar el API se reescriben tipados y se mueven a `services/` (el módulo `map` ya está así).
- El diseño de origen está en `docs/diseno/`; el conversor (`scripts/diseno-a-react`) quedó retirado.

## 4. Variables de entorno

- 🔒 **Nadie usa `process.env` fuera de `config/`.**
- API: `apps/api/src/config/` → `env.schema.ts` (valida) → `env.ts` (único que lee `process.env` y mapea nombres) → `areas/*.config.ts` → `AppConfig` (inyectable).
- Los services piden `config.auth.jwtAccessExpiresIn`; nunca el nombre de la variable.
- Web: `apps/web/src/config/` (`publicEnv` para el navegador, `serverEnv` solo servidor).
- Renombrar una variable = editar solo `env.ts`.
- Cada variable nueva se documenta en `.env.example`.

## 5. Tests

- API: Jest en `src/modules/<modulo>/tests/*.spec.ts`; e2e en `test/e2e/*.e2e-spec.ts` (Supertest). Web: Vitest en `src/**/*.test.ts`.
- Los tests de la API usan `describeCase(modulo, { que, espera, ejecutar, verificar })` para que el reporte diga **qué prueba, qué espera y qué obtuvo**:

```ts
describeCase('auth', {
  que: 'rechaza login con contraseña incorrecta',
  espera: 'error 401',
  ejecutar: () => service.login(dto),
  verificar: (resultado) => expect(resultado.status).toBe(401),
});
```

- Correr: `pnpm test` · `pnpm test:api` · `pnpm test:web` · `pnpm test:module <modulo>` · `pnpm test:watch` · `pnpm test:e2e`.

## 6. Seguridad (resumen; **detalle completo en [SEGURIDAD.md](SEGURIDAD.md)**)

- Rutas agrupadas con middlewares (`public`, `auth`, `verified`, `2fa`, `role`, `admin`) en un solo archivo; agregar uno = una línea.
- Nunca confiar en IDs del cliente; verificar propiedad del recurso en el service (Policies).
- Archivos: validar tipo por magic bytes, re-encodear imágenes con `sharp`, nombres UUID.

## 7. Estilo

- Prettier (`.prettierrc`): comillas simples, punto y coma, 100 columnas. `pnpm format`.
- Código y nombres de archivos en inglés técnico o español sin tildes; textos para el usuario en español.
- Nombre de la plataforma: **nunca escrito a mano**. API: `config.app.name`. Web: `brand.name` (`src/config/brand.ts`).

## 8. Migraciones de base de datos

Prisma Migrate: cada cambio de esquema es un archivo versionado en `apps/api/prisma/migrations/` y queda registrado en la tabla `_prisma_migrations` (nombre, checksum, fecha) de la base.

| Comando | Uso |
|---|---|
| `pnpm db:create <nombre>` | Crea la migración **sin aplicarla**, para revisar el SQL |
| `pnpm db:migrate` | Aplica pendientes en tu base local y regenera el cliente |
| `pnpm db:deploy` | Aplica solo migraciones ya escritas (producción / Supabase) |
| `pnpm db:status` | Qué está aplicado y qué pendiente |
| `pnpm db:reset` | Borra y recrea la base **local** |

Reglas de protección:
- **Nunca** edites una migración ya aplicada: el checksum no coincide y Prisma se niega a continuar.
- **No hay `down`**: para deshacer un cambio se crea otra migración que lo revierta.
- `reset`, `push`, `dev` y `create` están **bloqueados** si `NODE_ENV=production` o si la base no es local (ej. Supabase). Ahí solo funcionan `deploy` y `status` (`src/database/migration-guard.ts`, con tests).
- Nunca uses `prisma db push` ni cambies tablas a mano: siempre una migración.
- Antes de un `deploy` a una base con datos reales, haz un respaldo.
- Docker aplica `deploy` automáticamente al arrancar la API.

## 9. Versiones fijadas a propósito

- **NestJS 11** (CommonJS). Nest 12 es solo ESM y exige extensiones `.js` en los imports y Jest en modo experimental; se migra más adelante como tarea aparte.
- **TypeScript 5.9**. TS 7 elimina opciones que usan Nest y ts-jest.
