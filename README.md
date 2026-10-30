# Portal de Alquileres Venezuela

Plataforma web y app móvil para publicar y buscar inmuebles en alquiler en Venezuela. Incluye búsqueda con mapa interactivo, filtros adaptados al mercado local, citas y reservas, y paneles para dueños, agencias y administración.

Este documento resume el alcance, la arquitectura y las decisiones técnicas del proyecto.

## Nombre de la plataforma

**Pendiente de definir.** "Portal de Alquileres Venezuela" y `proyectoAlquiler` son nombres provisionales. No hardcodear el nombre en el código: usar una variable en la config (`APP_NAME`) y un solo archivo de marca en el frontend, para cambiarlo fácilmente cuando se decida. El dominio y el branding (logo, paleta) también están pendientes y se definen junto con el diseño del frontend.

## Estado actual

| Fase | Estado |
|---|---|
| Planeación y arquitectura | Hecha (este documento) |
| Fase 0 – Fundación | **Hecha** (monorepo, config, Docker, scripts, lint, tests) |
| **Fase 1 – Backend (NestJS)** | **Hecha** (auth + 2FA + Google, seguridad, propiedades + mapa + imágenes, agencias, citas, importación Excel/CSV, GraphQL de lectura, caché; verificada con pruebas automáticas) |
| Fase 2 – Web + diseño del frontend | **Pantallas listas con datos de ejemplo** (diseño en `docs/diseno/`, rutas en `apps/web/src/app/README.md`); falta conectar el API |
| Fase 3 – App móvil (Expo) | Pendiente |
| Fase 4 – Pulido | Pendiente |

**Frontend (Fase 2, avance):** las 22 pantallas del diseño (web + móvil + modo noche + color de marca variable) ya existen como React en `apps/web/src/modules/*`, con animaciones, avisos y navegación entre ellas. Los datos son de ejemplo (viven dentro de cada hook) y se reemplazarán por `services/` + TanStack Query al conectar la API. Diseño de origen y decisiones: `docs/diseno/README.md`. Cómo leer el código: `docs/GUIA-FRONTEND.md`.

La Fase 0 está lista y verificada: `docker compose up` levanta db, redis, mailpit, api y web; la API responde en `/api/health`; los tests, el lint y el build pasan. El backend de la Fase 1 ya existe y está documentado en `docs/`. Pendiente en el backend: cola de trabajos (BullMQ), y probar Google y Supabase Storage con credenciales reales.

---

## Cómo levantar el proyecto

Requisitos: Docker y pnpm (Node 22). No hace falta crear `.env`.

```bash
pnpm install        # una vez, para editor/lint/tests locales
pnpm dev            # = docker compose up
```

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api/health |
| Swagger | http://localhost:3001/docs |
| Correos (Mailpit) | http://localhost:8026 |

Si un puerto está ocupado, copia `.env.example` a `.env` y define `WEB_PORT`, `API_PORT`, `DB_PORT`, `REDIS_PORT` o `MAILPIT_UI_PORT`. Tienes más opciones en `scripts/dev.ps1` / `dev.sh` (todo, solo api, solo web, solo db) y `scripts/test.ps1` / `test.sh`. Las reglas de arquitectura están en [docs/CONVENCIONES.md](docs/CONVENCIONES.md).

> **Documentación para colaboradores** (empieza por aquí): [docs/README.md](docs/README.md) → [guía de colaboradores](docs/GUIA-COLABORADORES.md), [**seguridad**](docs/SEGURIDAD.md), [mapa de la API](docs/API.md) y [rendimiento](docs/RENDIMIENTO.md). Si vas a tocar el backend, lee la de seguridad antes de escribir código.

## 1. Contexto del producto

- Todo el entorno de desarrollo debe levantar con un solo comando, sin configuraciones complejas.
- Mercado venezolano: precios en USD y VES, WhatsApp como canal de contacto habitual y conexión móvil a veces lenta (imágenes livianas y paginación).

## 2. Perfiles de usuario

| Rol | Descripción |
|---|---|
| `CLIENT` | Busca alquiler: mapa, favoritos, alertas, solicita citas o apartado. |
| `OWNER` | Dueño directo: publica pocas propiedades con formulario guiado paso a paso. |
| `AGENCY` | Inmobiliaria **con subcuentas**: importación masiva por Excel/CSV, gestión de inventario. |
| `ADMIN` | Moderación de anuncios, gestión de usuarios, métricas, bloqueos y auditoría. |

**Modelo de agencia con subcuentas**
- `User` (cuenta personal con su login) + `AgencyProfile` (la organización) + `AgencyMember` (user, agency, rol `AGENCY_ADMIN` | `AGENT`, estado de invitación).
- El admin de la agencia invita agentes por email. Cada agente tiene su propio login y gestiona sus propiedades asignadas (el admin ve todas).
- `Property.ownerUserId`, `Property.agencyId`, `Property.assignedAgentId`.
- Límites por plan (cantidad de propiedades y de agentes). Permisos en Policies/guards centralizados.
- Un mismo usuario puede pasar de `CLIENT` a `OWNER` sin crear otra cuenta (roles como lista).

## 3. Stack aprobado

| Tema | Decisión |
|---|---|
| Backend | **NestJS 11** (TypeScript 5.9, CommonJS). Se descartó Python para compartir tipos con web/móvil. Nest 12 es solo ESM, se migra más adelante. |
| Base de datos | **PostgreSQL**. En local, imagen `postgis/postgis` en Docker. **Supabase solo como DB** (sin Supabase Auth ni RLS), para poder migrar cambiando únicamente `DATABASE_URL`. |
| ORM | **Prisma** (esquema y migraciones; sin lógica en el modelo, la lógica va en services). |
| API | **Híbrido**: REST (auth, subidas, importación Excel, webhooks) + **GraphQL solo en sectores necesarios** (búsqueda/listado con filtros, ficha de propiedad, dashboards). Controller y resolver son delgados y llaman al mismo service. `graphql-codegen` para tipos. |
| Web | **Next.js (App Router) + TypeScript**, SSR para SEO. |
| Móvil | **React Native con Expo**, comparte `packages/shared` con la web. |
| Estilos | **Tailwind CSS** + componentes UI en carpetas; tokens de diseño en un solo archivo. |
| Animaciones | **Framer Motion (`motion`)** en web, **Reanimated** en móvil. |
| Datos / estado | **TanStack Query** (servidor) + **Zustand** (UI mínima). |
| Formularios | **React Hook Form + Zod** (esquemas compartidos). |
| Mapas | MapLibre GL / Mapbox GL con clustering de pines. |
| Imágenes | **`sharp`** en un `ImagesService` (hace lo que haría Cloudinary): genera `.webp` thumb 300x200, medium 800x600 y HD. |
| Almacenamiento | **Supabase Storage** detrás de una interfaz `StorageProvider` (cambiable a S3/R2 sin tocar los módulos). |
| Monorepo | **pnpm workspaces**. |

### Decisión sobre geolocalización: simple primero

Se guardan `latitude` y `longitude` como números normales. Las búsquedas del mapa filtran por **bounding box** con Prisma normal, sin SQL a mano.

**PostGIS se activa después**, cuando haya muchos pines. Prisma no soporta el tipo `geography` de forma nativa, así que entonces se agrega una migración SQL única (columna `geography` + índice espacial calculados desde lat/lng) y **todo el SQL crudo de mapas vive en un solo archivo**, `PropertyGeoService`, dentro del módulo `properties`. El resto del código no se entera y no hay que reescribir nada.

## 4. Estructura del repositorio

```
proyectoAlquiler/
  apps/
    api/          # NestJS
    web/          # Next.js
    mobile/       # Expo (fase 3)
  packages/
    shared/       # tipos, enums (PropertyStatus, Role), esquemas Zod, tipos GraphQL generados
  scripts/        # .ps1 y .sh equivalentes a los scripts de pnpm
  docs/
    CONVENCIONES.md
  docker-compose.yml
  .env.example
  pnpm-workspace.yaml
  README.md
```

## 5. Regla de oro: arquitectura 100% modular

Cada lógica tiene su carpeta y un **archivo padre** que importa a los hijos. Nadie importa los archivos hijos directamente, solo el padre. Componentes con poca lógica y **máximo 600 líneas por archivo**; si hay mucha lógica, va en su carpeta de módulo como mini funciones.

### Backend: `apps/api/src/modules/<modulo>/`

```
auth/
  auth.module.ts          # padre: registra todo
  auth.controller.ts      # delgado: solo llama al service y responde lo que dice
  auth.resolver.ts        # solo si hay GraphQL; igual de delgado
  dto/                    # validación de entrada: login.dto, register.dto, two-factor.dto, reset.dto ...
  services/
    auth.service.ts       # fachada: delega en los hijos
    login.service.ts
    register.service.ts
    two-factor.service.ts
    reset-password.service.ts
  jobs/                   # colas BullMQ: cada job SOLO llama a un service
  commands/               # nest-commander: cada comando SOLO llama a un service
  tests/
```

- Controller **nunca** tiene lógica. La validación vive **solo** en DTO. La lógica vive **solo** en services.
- Un job o command = una llamada a un service.
- **Rutas agrupadas**: `routes/index` → `routes/api.routes` → `routes/<modulo>.routes`, agrupadas con prefijos (RouterModule de Nest).

### Frontend: `apps/web/src/modules/<modulo>/`

```
auth/
  index.ts        # PADRE: único punto de importación del módulo
  components/     # LoginForm, RegisterForm ... (poca lógica, <600 líneas)
  hooks/          # useLogin ... (lógica de UI)
  services/       # login.ts, register.ts, twoFactor.ts, reset.ts + index.ts (llamadas al API)
  schemas/        # Zod
  types/
```

- Las `pages` de `app/` solo importan desde `modules/<x>`, nunca archivos internos.
- ESLint fuerza esto con `no-restricted-imports` / `eslint-plugin-boundaries` y `max-lines: 600`.
- Rutas tipadas agrupadas en `routes/` (index → grupos → archivos hijos).

## 6. Configuración centralizada de variables de entorno

**Nadie lee `process.env` fuera de la capa `config/`** (regla ESLint `no-process-env`, con excepción solo en `config/`).

- API: `apps/api/src/config/`
  - `env.schema.ts`: valida con Zod al arrancar; falla rápido y con mensaje claro si falta algo.
  - `env.ts`: **único** archivo que lee `process.env` y mapea nombres.
  - Archivos hijos por área: `database.config.ts`, `auth.config.ts`, `mail.config.ts`, `storage.config.ts`, `security.config.ts`, `google.config.ts`, agrupados por `config/index.ts`.
  - Los services reciben la config tipada por inyección y piden `config.auth.jwtExpiresIn`; **nunca** el nombre de la variable.
- Web: `apps/web/src/config/` igual (`env.ts` + `index.ts`), separando variables públicas (`NEXT_PUBLIC_*`) de las de servidor.
- Móvil: `apps/mobile/src/config/`.
- Renombrar una variable de entorno = editar solo `env.ts`.
- `.env.example` documenta cada variable y trae valores por defecto que ya funcionan.

## 7. Docker y arranque (simple, un comando)

Un solo `docker-compose.yml` en la raíz. El usuario copia `.env.example` a `.env` y corre `docker compose up`:

- `db`: imagen `postgis/postgis`, con volumen persistente.
- `api`: NestJS en modo watch (código montado), corre `prisma migrate deploy` + seed con datos de ejemplo al iniciar.
- `web`: Next.js en modo dev con hot reload. **En Windows el volumen no avisa de los cambios**: si editas la web y no se refleja (CSS, rutas, `support/`), reinicia solo ese servicio con `docker compose restart web` y espera la primera compilación.
- `redis`: rate limit y colas.
- `mailpit`: ver correos (códigos de verificación) en local sin configurar nada.
- Supabase es **opcional**: se descomenta `DATABASE_URL` para apuntar a él.
- Sin Nginx, sin redes personalizadas, Dockerfiles mínimos de un solo stage. Expo (fase 3) corre fuera de Docker.

**Scripts en el `package.json` raíz** (más equivalentes `.ps1` y `.sh` en `scripts/`):

| Script | Qué hace |
|---|---|
| `pnpm dev` | Levanta todo |
| `pnpm dev:api`, `dev:web`, `dev:db`, `dev:mobile` | Levanta solo una parte |
| `pnpm stop` | Detiene todo |
| `pnpm db:reset`, `db:seed`, `db:migrate` | Gestión de la base de datos |

## 8. Tests modulares y legibles

| Script | Qué corre |
|---|---|
| `pnpm test` | Todos |
| `pnpm test:api`, `pnpm test:web` | Solo API o solo web |
| `pnpm test:module auth` | Solo un módulo |
| `pnpm test:watch`, `pnpm test:e2e` | Modo watch y end-to-end |

- Jest + Supertest en API (tests en la carpeta `tests/` de cada módulo), Vitest en web.
- Cada test explica **qué prueba, qué espera y qué obtuvo**: nombres descriptivos en español (`debe rechazar login con contraseña incorrecta`), un helper `describeCase({ que, espera })` y un reporter propio que imprime "Esperado: X / Obtenido: Y" por caso, con resumen por módulo.

## 9. Seguridad

### 9.1 Middlewares agrupables
- Grupos de rutas declarados en un solo archivo `routes/groups.ts`: `public`, `guest`, `auth`, `verified`, `2fa`, `role:<rol>`, `admin`.
- Agregar un middleware a un grupo = una línea. Cada middleware es un guard/interceptor pequeño en `common/security/middleware/`.
- **Rate limit** con `@nestjs/throttler` por grupo; estricto en login, registro, reset y códigos (por IP y por email). Redis en compose, memoria en dev.
- Base: `helmet`, CORS por entorno, validación global con whitelist, hash `argon2`, JWT de acceso corto + refresh rotativo en cookie httpOnly.

### 9.2 Bloqueos
Módulo `security` con tabla `BlockRule` (tipo IP | CIDR | país/región | usuario | email o dominio, motivo, expiración). Un middleware global consulta las reglas (con caché) antes de login y registro. GeoIP con MaxMind GeoLite2. Panel admin para crear y quitar bloqueos. Bloqueo automático tras N intentos fallidos o abuso.

### 9.3 Auth profesional
- Registro con **verificación por correo**: enlace y/o **código de 6 dígitos** con expiración, intentos limitados y reenvío con cooldown.
- **2FA**: TOTP con app autenticadora + códigos de respaldo (opcional código por email).
- Reset de contraseña por código o enlace. Cierre de sesiones y lista de dispositivos.
- **Google OAuth**: iniciar sesión con Google y **asociar/desasociar** Google a una cuenta existente (tabla `SocialAccount`: provider, providerId, userId; vinculación por email verificado). Sin duplicados y con confirmación al enlazar.
- **Email**: `MailService` detrás de una interfaz (SMTP/Resend/SES), plantillas en su carpeta, envío por job de BullMQ que solo llama al service.

### 9.4 Solo nuestra app puede llamar al backend
- CORS con lista blanca de orígenes (dominio web; en dev, mismo host/IP/localhost) en `security.config.ts`.
- `AppOriginGuard`: valida `Origin`/`Referer` y una cabecera de cliente (`X-App-Client` + firma por app: web, mobile). En producción, API tras el mismo dominio/proxy con `trust proxy` bien configurado. IPs y dominios permitidos editables por env.
- **Aclaración honesta:** ninguna cabecera es infalsificable (la app móvil no puede guardar secretos), por eso es una capa más junto a JWT, rate limit y bloqueos, no la única.

### 9.5 Nunca confiar en IDs del cliente
- El usuario sale **siempre del token** (`@CurrentUser()`).
- Los DTO no aceptan `userId`, `role`, `ownerId`, `agencyId` ni campos internos (whitelist + `forbidNonWhitelisted`, campos sensibles prohibidos explícitamente).
- La propiedad de recursos se verifica en el service con Policies (contra IDOR). IDs públicos UUID.

### 9.6 Anti-hacks en datos
Validación estricta en DTO/Zod, límite de tamaño de body, sanitización de strings (XSS), consultas parametrizadas (`$queryRaw` solo con parámetros), GraphQL con depth limit y query cost e introspección apagada en producción, protección contra mass assignment, paginación con tope.

### 9.7 Anti-hacks en archivos
- MIME real por **magic bytes** (no extensión ni Content-Type), lista blanca de tipos, tope de tamaño y de cantidad.
- Re-encodeo de imágenes con `sharp` (destruye payloads, polyglots y EXIF/GPS), nombres UUID, nunca servir desde el directorio de la app.
- Excel/CSV: límite de filas y tamaño, bloqueo de macros (`.xlsm`), neutralización de fórmulas (`=`, `+`, `-`, `@` → CSV injection), parseo en job aislado.

### 9.8 Auditoría
Módulo `audit` con tabla `AuditLog` (quién, acción, recurso, IP, user-agent, antes/después, fecha), alimentada por un interceptor global y eventos explícitos (login, 2FA, cambios de rol, bloqueos, publicar/reservar propiedad, importaciones, borrados). Visor con filtros en el panel admin. **Nunca** registra contraseñas, tokens ni códigos. Retención configurable.

## 10. Almacenamiento de imágenes (orden de carpetas)

Originales privados, variantes públicas:

```
properties/{propertyId}/original/{uuid}.jpg    # privado, solo backend
properties/{propertyId}/thumb/{uuid}.webp
properties/{propertyId}/medium/{uuid}.webp
properties/{propertyId}/hd/{uuid}.webp
avatars/{userId}/...
agencies/{agencyId}/logo|banner/...
imports/{agencyId}/{fecha}/archivo.xlsx        # privado
```

La subida siempre pasa por el backend: valida MIME real, tamaño y límite por plan, elimina EXIF/GPS, usa nombres UUID (nunca el original). Las claves de Supabase solo viven en el servidor. URLs firmadas para lo privado. Un job limpia archivos huérfanos.

## 11. Reglas de negocio clave

- **`PropertyStatus`:** `PUBLICADA`, `RESERVADA`, `ALQUILADA`, `PAUSADA`.
- El cliente solicita una cita o apartado desde la ficha. El dueño o la agencia recibe el *lead* y puede marcar la propiedad como `RESERVADA`.
- Una propiedad reservada **no desaparece**: muestra una insignia "En Proceso de Reserva".
- Filtros: ubicación (estado, municipio, urbanización), precio (USD/VES), habitaciones, baños, estacionamiento y *amenities* locales: **planta eléctrica**, **tanque de agua / hidroneumático**, **fibra óptica**, **vigilancia**.
- Mapa interactivo con clustering de pines que al hacer zoom muestra pines individuales y un popup con tarjeta flotante del inmueble.
- Importación masiva (agencias): plantilla `.xlsx`/`.csv`, validación fila por fila e inserción por lotes (`exceljs`).
- `Lead` debe contemplar WhatsApp como canal de contacto.

## 12. Plan por fases

### Fase 0 – Fundación (HECHA)
Monorepo pnpm, `packages/shared`, config de entorno, Docker compose, scripts, ESLint/Prettier con reglas (`max-lines`, límites entre módulos, `no-process-env`), `docs/CONVENCIONES.md`, `.env.example`, infraestructura de tests.

### Fase 1 – Backend (SIGUIENTE)
- `prisma/schema.prisma` con: `User`, `AgencyProfile`, `AgencyMember`, `SocialAccount`, `BlockRule`, `AuditLog`, `Property` (lat/lng, precio USD/VES, amenities locales, estado), `PropertyImage` (thumb/medium/hd), `Appointment`/`Lead`, enum `PropertyStatus`.
- Módulos Nest: `auth`, `users`, `security`, `audit`, `properties`, `imports`, `appointments`, y `common/` (storage, images, mail, prisma, graphql).
- `.env.example` con `DATABASE_URL` (pooler de Supabase) y `DIRECT_URL` para migraciones.

### Fase 2 – Web
Next + Tailwind + Motion. Módulos: `auth`, `properties` (listado, ficha, filtros), `map`, `appointments`, `dashboard-owner`, `dashboard-agency` (importación Excel), `admin`. Pendiente definir: sistema de diseño, paleta, tipografía, animaciones y pantallas.

### Fase 3 – App móvil
Expo reutilizando `packages/shared`.

### Fase 4 – Pulido
SEO, animaciones, rendimiento, moderación admin, activar PostGIS si hace falta.

## 13. Verificación esperada (criterios de "terminado")

- `pnpm dev` levanta db + api + web + redis + mailpit sin pasos extra. Swagger en `/docs` y GraphQL playground responden. El arranque falla con mensaje claro si falta una variable.
- `pnpm test` y `pnpm test:module auth` pasan mostrando qué se probó, qué se esperaba y qué se obtuvo.
- Rate limit devuelve 429; IP, país u origen bloqueado recibe 403; un body con `userId` o `role` es rechazado; archivos con extensión falsa o polyglot son rechazados; Excel con fórmulas maliciosas se neutraliza.
- El código de registro se ve en Mailpit; 2FA y vincular/desvincular Google funcionan; las acciones sensibles quedan en `AuditLog`.
- El lint falla si hay `process.env` fuera de `config/`, archivos de más de 600 líneas o imports a archivos internos de otro módulo.
- Se puede importar un `.xlsx` de ejemplo, subir una imagen y ver sus 3 variantes en las carpetas correctas, y consultar propiedades por bounding box.

## 14. Siguientes pasos

0. Definir el nombre, dominio y branding de la plataforma (pendiente, no bloquea las fases 0 y 1).
1. ~~Fase 0 (fundación del monorepo)~~ — hecha.
2. Ejecutar la **Fase 1** (backend), empezando por `schema.prisma` y el módulo `auth`.
3. Conectar el frontend con el API y completar las pantallas pendientes.
