# Convenciones del proyecto

Reglas de arquitectura. Varias las hace cumplir ESLint (`pnpm lint`), las marcadas con 🔒.

## 1. Modularidad

- Cada lógica vive en **su carpeta de módulo**, con un **archivo padre** que importa a los hijos.
- 🔒 **De otro módulo solo se importa su archivo padre** (`<modulo>.module.ts` o `index.ts`), nunca archivos internos. Regla local: `eslint-rules/module-boundaries.mjs`.
- 🔒 **Mini módulos:** una carpeta dentro de un módulo con su propio `<nombre>.module.ts` (ej. `modules/security/ownership/`) es **privada de su módulo padre**: desde fuera solo se importa el `index.ts` del padre, y entre hermanos solo por el `index.ts` del otro. Así toda una familia (como la seguridad) vive en un módulo y cada pieza se puede agregar o quitar sin tocar las demás.
- 🔒 **Máximo 600 líneas por archivo.** Si crece, se parte en mini archivos dentro del módulo.
- Componentes con poca lógica; la lógica va en `hooks/` del módulo (y en `services/` si el módulo llama al API por su cuenta, como `auth`). Lo que comparten varios módulos va en `apps/web/src/lib/<tema>/`.

## 2. Backend (`apps/api/src/modules/<modulo>/`)

Referencia viva: `modules/properties/` (cada carpeta tiene su README).

```
<modulo>/
  <modulo>.module.ts          # padre
  index.ts                    # lo único que otros módulos pueden importar
  <modulo>.resolver.ts        # solo si hay GraphQL; igual de delgado
  controllers/                # las rutas, separadas por quién puede usarlas
    public/                   #   sin sesión                      -> @PublicGroup() / @GuestGroup()
    private/                  #   requiere sesión
      user/                   #     cualquier usuario autenticado -> @AuthGroup()
      publisher/              #     propietario, agencia y admin  -> @PublisherGroup()
      admin/                  #     solo admin                    -> @AdminGroup()
      <rol>/                  #     otros grupos por rol, con su carpeta     -> @AgencyGroup() en agency/
  contracts/                  # todo lo que entra y sale del módulo, y nada más
    dto/                      #   lo que ENTRA: valida body, query y params
    resources/                #   lo que SALE: una interface por respuesta
  services/
    <modulo>.service.ts       # fachada: el controller y el resolver solo hablan con ella
    <tema>/                   # una carpeta por tema (catalog, management, images, access...)
      <modulo>-<caso>.service.ts   # un archivo por caso de uso
  decorators/                 # decoradores compuestos, solo si algo se repite 3+ veces
  utils/                      # funciones puras compartidas por varios services
  jobs/                       # solo llaman a UN service
  commands/                   # solo llaman a UN service
  tests/
```

Las carpetas aparecen **solo si existen**: un módulo sin rutas de admin no tiene `admin/`; uno con 4 services o menos los deja planos en `services/`. Cada carpeta lleva su `README.md`.

**Reglas generales**
- Controller: **cero lógica**. Validación: **solo** en `contracts/dto/`. Lógica: **solo** en services.
- Job o command = una llamada a un service.
- Los DTO **nunca** aceptan `userId`, `role`, `ownerId`, `agencyId` ni campos internos: el usuario sale del token.
- `contracts/` no importa de controllers ni de services; solo al revés.

**Controllers**
- Un controller = **un acceso + un recurso**. El decorador de grupo va en la clase, una sola vez; la carpeta debe coincidir con ese grupo (`public/` con `@PublicGroup()`).
- Una excepción de rol en una sola ruta se pone en el método (sobrescribe a la clase) y lleva un comentario que diga por qué.
- Los roles no se listan sueltos: se nombran en `common/security/groups` (`PublisherGroup`, `AdminGroup`...).
- El tipo de retorno de cada ruta es su `Resource` (`Promise<PropertyListResource>`), para saber qué entrega sin abrir el service.
- Rutas fijas (`mine`, `map`) antes que `:id`: el controller con `GET :id` va **último** en la lista `controllers` del módulo.
- Si un conjunto de decoradores se repite 3+ veces o ensucia el método, pasa a un decorador compuesto en `decorators/` (`@UploadImages()`).

**Contracts**
- `dto/`: clases con class-validator, un archivo por caso (`create-x.dto.ts`, `mine-x.dto.ts`). Sin lógica de negocio.
- `resources/`: **interfaces simples**, sin decoradores ni tipos rebuscados (nada de `Pick`/`Omit` encadenados). Un archivo por respuesta; si dos comparten campos, una `extends` la otra. Los comentarios explican los campos que no son obvios.
- Los services y el mapper declaran lo que devuelven con esos tipos: si el código devuelve otra forma, no compila.

**Services**
- Una carpeta por **tema** (un sustantivo) y un archivo por **caso de uso**: `<modulo>-<caso>.service.ts`.
- Las lecturas (sin efectos, cacheables) no se mezclan con las escrituras (auditan, usan transacciones).
- **No se separa por verbo** (crear, editar, borrar): comparten permisos, auditoría y caché.
- Un archivo de más de ~150 líneas se divide y cada pieza se nombra por lo que hace.
- Lo que comparten varios services va en `utils/`, no se importa de un service a otro del mismo tema.
- Los permisos (quién puede hacer qué) viven en `access/`. Otros módulos solo usan lo que exporta el `index.ts`.

**Nombres de tipos: el sufijo dice el papel**

| Sufijo | Papel | Ejemplo |
|---|---|---|
| `Dto` | lo que entra por HTTP | `CreatePropertyDto` |
| `Resource` | lo que sale por HTTP | `PropertyCardResource` |
| `Context` | datos de la petición actual que no vienen del body | `RequestContext`, `AuthUserContext` |
| `Payload` | contenido de un token | `AccessTokenPayload` |
| `Service` / `Policy` / `Vault` | clases con lógica | `PropertyPolicyService` |

Un archivo por tipo, con el papel en el nombre (`create-property.dto.ts`, `property-card.resource.ts`, `auth-user-context.type.ts`). Los tipos compartidos de seguridad viven en `common/security/types/`.

**Imports**
- `@/` apunta a `src/` (en la API y en la web, cada una con el suyo) y, solo en la API, `@test/` apunta a `test/`. Lo cercano va relativo (`./` y `../`); lo que sale del módulo, o subiría 3 niveles o más, va con el alias. 🔒 El lint rechaza cualquier `../../../` en la API.

**Qué hace cumplir el código:** el lint (imports profundos, módulos, paquetes de terceros), `common/security/tests/controller-layout.spec.ts` (carpeta del controller = grupo de acceso) y `test/support/resource-contract.ts` (la respuesta real cumple el Resource). Guía para repetir todo este sistema en otro proyecto: [BACKEND-MODULAR.md](BACKEND-MODULAR.md).

**Checklist al crear o refactorizar un módulo**
1. Listar las rutas y su acceso; guardar la lista de rutas `Mapped` del arranque para compararla después.
2. Controllers por acceso, con el grupo en la clase y la carpeta que coincide.
3. `contracts/dto` para lo que entra y un `Resource` por cada respuesta; tipos de retorno en controllers y services.
4. Services por tema, con fachada; dividir lo que pase de ~150 líneas.
5. Decoradores compuestos para lo que se repite; imports con `@/`.
6. README en cada carpeta nueva.
7. Verificar: `tsc`, `pnpm lint`, pruebas unitarias, el e2e del módulo y que la lista de rutas sea idéntica a la de antes.

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
  README.md
  components/       # <Pagina>.tsx y una carpeta <Pantalla>/ por pantalla (poca lógica)
  hooks/            # use<Pantalla>.ts: la lógica de cada pantalla
  services/         # solo si el módulo tiene llamadas propias al API (hoy: auth y security)
  tests/ utils/ …   # solo si existen
```

- Las carpetas aparecen **solo si existen** (`design` solo tiene `components/`). No hay `schemas/` ni `types/`: los tipos viven junto a lo que describen.
- Las páginas de `app/` solo importan desde `@/modules/<modulo>`. Entre módulos solo se importa el `index.ts` del otro (ej. `useSession` de `@/modules/auth`).
- **Datos compartidos entre módulos** van en `apps/web/src/lib/<tema>/` (hoy `properties`, `appointments` y `reply-templates`): tipos, llamadas al API y formato. La llamada HTTP siempre pasa por `lib/api.ts`.
- **Paquetes de terceros** solo vía `apps/web/src/support/` (ver §10).

## 3b. Cómo está organizado el frontend de pantallas

- Una pantalla = carpeta `<Pantalla>/` con el componente, sus partes con nombre (ej. `HomeIntro`, `HomeListings`) y su `.css`; la lógica va en `hooks/use<Pantalla>.ts`. Guía completa: `docs/GUIA-FRONTEND.md`.
- Iconos: siempre `<Icon name="..." />` (`components/icons`). Barra lateral y de pestañas de la inmobiliaria: `AgencySidebar` y `AgencyTabBar`.
- Escritorio y móvil se alternan con `<Responsive>` (o `<ClientResponsive>` si la pantalla pesa, como el mapa); el tema (color de marca y modo noche) vive en `app/globals.css`.
- Conectados a la API: `home`, `map`, `properties`, `inbox`, `auth` y `security` (datos con TanStack Query vía `QuerySupport`, llamadas en `lib/` o `services/`). Con datos de ejemplo todavía: `dashboard-agency`, `publish` y `admin`, cuyos hooks traen los datos dentro; al conectarlos se reescriben igual que los anteriores.
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

- **Los Resources se comprueban contra la respuesta real**: en el e2e, cada ruta con un tipo de retorno `XResource` se valida automáticamente (campos obligatorios, tipos y que no sobre ningún dato). Toda ruta nueva necesita al menos una prueba e2e que la ejecute. Detalle en `apps/api/test/README.md`.
- Correr: `pnpm test` · `pnpm test:api` · `pnpm test:web` · `pnpm test:module <modulo>` · `pnpm test:watch` · `pnpm test:e2e`.

## 6. Seguridad (resumen; **detalle completo en [SEGURIDAD.md](SEGURIDAD.md)**)

- Rutas agrupadas con middlewares (`public`, `auth`, `verified`, `2fa`, `role`, `admin`) en un solo archivo; agregar uno = una línea.
- Nunca confiar en IDs del cliente; verificar propiedad del recurso en el service (Policies).
- Archivos: validar tipo por magic bytes, re-encodear imágenes con `sharp`, nombres UUID.

## 7. Estilo

- Prettier (`.prettierrc`): comillas simples, punto y coma, 100 columnas. `pnpm format`.
- Código y nombres de archivos en inglés técnico o español sin tildes; textos para el usuario en español.
- Imports: ver la regla de `@/` en la sección 2 (Backend).
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

## 10. Paquetes de terceros solo vía `support/` 🔒

Para que una versión mayor futura de un paquete no obligue a tocar medio proyecto, la API usa **módulos propios** en `apps/api/src/support/<modulo>/` y nunca el paquete directo.

- Hoy: `password` (argon2), `cache` (ioredis), `mail` (nodemailer), `images` (sharp), `jwt` (@nestjs/jwt), `google-identity` (google-auth-library), `totp` (otplib + qrcode), `spreadsheet` (exceljs), `db` (@prisma/client). Lista y cómo agregar uno: `apps/api/src/support/README.md`.
- ESLint falla si importas uno de esos paquetes fuera de su carpeta, o un archivo interno de `support/<modulo>` en vez de su `index`.
- `support/tests/support-modules.spec.ts` exige `index.ts` + `README.md` por módulo y que todo lo exportado esté documentado.
- Todo se usa con el prefijo del módulo, también los providers de Nest: `SpreadsheetSupport.buildXlsx()`, `PasswordSupport.hash()`, `TotpSupport.check()`, `ImagesSupport.render()`, `MailSupport.Service`, `CacheSupport.HttpCache`, `JwtSupport.Signer`, `GoogleIdentitySupport.Verifier`; los tipos y enums de Prisma salen de `DbSupport` (`DbSupport.Role`, `DbSupport.User`). Así se ve de dónde viene en cada llamada.
- La API de cada módulo es propia (errores y tipos propios), para que cambiar de paquete no cambie a quienes lo usan.
- **No se envuelven** los paquetes acoplados al framework (`@nestjs/*`, `class-validator`, `next`, `react`).
- **En la web** (`apps/web/src/support/`): `motion` (motion), `query` (@tanstack/react-query) y `maplibre` (maplibre-gl), usados como `MotionSupport.motion.div`, `QuerySupport.useQuery()` y `MapLibreSupport.load()`. Ver `apps/web/src/support/README.md`.
