# Portal de Alquileres Venezuela

Plataforma web para publicar y buscar inmuebles en alquiler en Venezuela. Está formada por una **API** (NestJS + PostgreSQL) y una **web** (Next.js). Los clientes buscan en un mapa interactivo, guardan favoritos y le escriben al anunciante desde la ficha; los dueños y las inmobiliarias reciben esos mensajes, proponen fechas de visita y gestionan su inventario; un administrador modera y audita.

> **Nombre pendiente.** "Portal de Alquileres Venezuela" y `proyectoAlquiler` son provisionales. El nombre sale de `NEXT_PUBLIC_APP_NAME` (web) y `APP_NAME` (API); los textos de marca están en `apps/web/src/config/brand.ts`. No lo escribas a mano en el código.

## Estado actual

| Parte | Estado |
|---|---|
| **API** (`apps/api`) | **Completa y probada.** Autenticación (contraseña, passkeys, 2FA, Google), seguridad, propiedades con mapa e imágenes, agencias, citas con conversación, textos reutilizables, importación Excel/CSV, ajustes del panel, auditoría, GraphQL de lectura y caché. |
| **Web conectada a la API** | Inicio, mapa y filtros, ficha de propiedad, favoritos, **mensajes** (bandeja, conversación y respuestas guardadas), registro, ingreso, recuperación de contraseña, verificación de correo y pantallas de seguridad de la cuenta. |
| **Web con datos de ejemplo** (falta conectar) | Panel de inmobiliaria (`/panel/*`), publicar propiedad (`/publicar`) y moderación de anuncios (`/admin`). La pantalla existe y se ve completa, pero sus datos viven dentro del hook y no llaman a la API. Para publicar y para el panel la API ya tiene las rutas; **la moderación de anuncios todavía no existe en la API** (solo la gestión de usuarios, bloqueos, ajustes y auditoría). |
| **App móvil** | No iniciada (no existe `apps/mobile`). La API ya acepta clientes móviles (`X-App-Client: mobile`). |

**Pendiente en el backend:** cola de trabajos (los correos hoy se envían dentro de la misma petición), probar Google y Supabase con credenciales reales, y la tasa del dólar (el botón "Ver en Bs." de la web todavía no convierte).

---

## Cómo levantar el proyecto

Requisitos: **Docker** y **pnpm** (Node 22 o superior). No hace falta crear `.env`: todo trae valores de desarrollo que ya funcionan.

```bash
pnpm install        # una vez, para editor, lint y tests locales
pnpm dev            # = docker compose up
```

Al arrancar, la API aplica las migraciones y siembra datos de ejemplo (~120 propiedades por Venezuela con 3 fotos cada una y 4 cuentas).

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API (salud) | http://localhost:3001/api/health |
| Swagger (solo en desarrollo) | http://localhost:3001/docs |
| Correos (Mailpit) | http://localhost:8026 |

**Cuentas de ejemplo** (solo desarrollo, clave `Demo12345`; el seed se niega a correr en producción o contra una base remota):

| Cuenta | Rol |
|---|---|
| `cliente@demo.local` | `CLIENT` |
| `dueno@demo.local` | `OWNER` |
| `agencia@demo.local` | `AGENCY` (administrador de "Inmuebles Demo") |
| `admin@demo.local` | `ADMIN` (para entrar al panel activa primero el 2FA) |

**Servicios de `docker-compose.yml`:** `db` (PostgreSQL 17 con imagen `postgis`), `redis` (caché y límites de uso), `mailpit` (bandeja de correos local: aquí aparecen los códigos de verificación), `install` (instala dependencias y genera Prisma, una vez), `shared` (compila `packages/shared` en modo watch), `api` (NestJS en modo watch) y `web` (Next.js en modo dev).

- **Windows:** el volumen no avisa de los cambios de la web. Si editas la web y no se refleja (CSS, rutas, `support/`), reinicia solo ese servicio con `docker compose restart web` y espera la primera compilación.
- **Puertos ocupados:** copia `.env.example` a `.env` y define `WEB_PORT`, `API_PORT`, `DB_PORT`, `REDIS_PORT` o `MAILPIT_UI_PORT`.

| Script | Qué hace |
|---|---|
| `pnpm dev`, `pnpm dev:build` | Levanta todo (con `--build` la segunda) |
| `pnpm dev:api`, `dev:web`, `dev:db` | Solo una parte (`dev:db` = db + redis + mailpit) |
| `pnpm stop`, `pnpm logs` | Detiene todo / sigue los registros |
| `pnpm db:migrate`, `db:deploy`, `db:status`, `db:seed`, `db:reset`, `db:create` | Base de datos (`db:reset` y `push` están bloqueados en producción o contra bases remotas) |
| `pnpm test`, `test:api`, `test:web`, `test:module <nombre>`, `test:watch`, `test:e2e` | Pruebas |
| `pnpm lint`, `lint:fix`, `format`, `build` | Calidad y compilación |

También hay `scripts/dev.ps1` / `dev.sh` y `scripts/test.ps1` / `test.sh` con más opciones.

> **Documentación para colaboradores** (empieza por aquí): [docs/README.md](docs/README.md) → [guía de colaboradores](docs/GUIA-COLABORADORES.md), [**seguridad**](docs/SEGURIDAD.md), [mapa de la API](docs/API.md) y [rendimiento](docs/RENDIMIENTO.md). Si vas a tocar el backend, lee la de seguridad antes de escribir código.

---

## Qué hace la app

### Perfiles

| Rol | Qué puede hacer |
|---|---|
| `CLIENT` | Busca en el mapa y la lista, guarda favoritos, le escribe al anunciante y conversa con él. |
| `OWNER` | Dueño directo. Publica propiedades, recibe y responde mensajes, propone fechas de visita y cambia el estado de la propiedad. Un `CLIENT` suma este rol sin crear otra cuenta (`POST /api/users/me/become-owner`); los roles son una lista. |
| `AGENCY` | Inmobiliaria **con subcuentas**: perfil y equipo, importación masiva, inventario. Sus agentes reciben este mismo rol al aceptar la invitación. |
| `ADMIN` | Gestiona usuarios (suspender o reactivar), bloqueos, ajustes de la plataforma y consulta la auditoría. Siempre con 2FA. No se crea por la API pública. |

**Agencias con subcuentas:** `User` (cuenta personal con su login) + `AgencyProfile` (la organización) + `AgencyMember` (usuario, agencia, rol `AGENCY_ADMIN` o `AGENT`, estado de la invitación). El administrador de la agencia invita agentes por correo (enlace de un solo uso); cada agente tiene su propio login y ve las propiedades que se le asignan, el administrador ve todas. Hay límites por plan: `maxProperties` (100) y `maxAgents` (5) por defecto, que la agencia no puede cambiar.

### Buscar

- **Mapa y lista** con filtros: ubicación (estado, municipio, urbanización), precio por moneda, habitaciones, baños, estacionamiento y los servicios que importan en Venezuela: **planta eléctrica**, **tanque de agua**, **fibra óptica** y **vigilancia**. Los filtros viajan en la URL.
- **Pines agrupados:** la API devuelve los pines agrupados (clusters) según la caja visible del mapa y el nivel de zoom; al acercar aparecen los pines sueltos y un popup con la tarjeta de la propiedad. El mapa se dibuja con MapLibre.
- **Precio en USD o VES:** cada propiedad guarda su monto y su moneda. Todavía no hay conversión entre ambas.
- **Favoritos** reales de la cuenta (con sesión; sin sesión el corazón pide ingresar).

### Contactar al anunciante

El cliente **nunca elige una fecha**. Desde la ficha toca **Estoy interesado**, **Tengo una pregunta** o **Pedir una visita** (o **Apartar**) y escribe un mensaje; también puede ir a WhatsApp.

1. El mensaje abre una **conversación** con quien gestiona la propiedad (dueño, agencia o agente asignado), que recibe un correo con el enlace (nunca con el texto).
2. Quien gestiona responde (la solicitud pasa de `PENDIENTE` a `ABIERTA`) y, si es una visita, **propone de 1 a 5 fechas**. El cliente acepta una y queda registrada (`CONFIRMADA`). La ficha pública solo dice "Ya tiene una visita programada", **nunca el día**.
3. Quien gestiona deja la propiedad **Disponible**, **Reservada** (aún acepta citas) o **Reservada del todo** (ya no recibe solicitudes), y puede cerrar la conversación.
4. Un **apartado** confirmado pasa la propiedad a `RESERVADA` (el primero gana); si el cliente lo cancela, vuelve a `PUBLICADA`.

Detalles que conviene saber:
- **No es en tiempo real.** Las respuestas suelen tardar: la conversación se carga al abrirla y se actualiza con el botón **Recargar**; el aviso llega por correo.
- Cada quien puede **editar sus mensajes hasta 3 minutos** después de enviarlos. Lo valida el servidor (la web solo muestra la cuenta regresiva con la hora del servidor).
- **WhatsApp:** el número del anunciante solo se entrega a quien tiene sesión (es un dato personal).
- Cada conversación guarda hasta 200 mensajes. La bandeja marca lo no leído.

### Respuestas guardadas

Quien responde guarda los textos que repite (horarios, requisitos, "sigue disponible") como **privados** o **compartidos con todo el equipo de su inmobiliaria**, y los usa con un toque dentro de la conversación. `{nombre}` y `{propiedad}` se completan solos. Títulos y textos van cifrados. Límites: 50 privados por persona y 100 compartidos por inmobiliaria. Solo el autor o el administrador de la agencia edita un texto compartido; los privados de otra persona no los ve nadie, ni un administrador.

### Publicar y administrar

- **Publicar** (API): crear, editar, cambiar estado, asignar agente, borrar y subir hasta 20 fotos por propiedad. La web tiene el formulario guiado de 6 pasos, pero todavía con datos de ejemplo.
- **Importación masiva** (solo agencias): plantilla `.xlsx` o `.csv`, hasta 5 MB y 500 filas; cada fila se valida con las mismas reglas que publicar a mano y se inserta por lotes. Rechaza macros y fórmulas, y neutraliza textos que empiezan con `=`, `+`, `-` o `@`.
- **Administración:** usuarios, bloqueos (IP, rango, país, usuario, correo o dominio), visor de auditoría y **ajustes que el admin cambia desde el panel** (hoy, el correo con Resend: la clave queda cifrada).

---

## Cómo funciona por dentro

**Una petición** (REST o GraphQL) atraviesa estas capas, declaradas en `common/security/global-guards.module.ts`: origen de la app (`Origin` + `X-App-Client` + `X-App-Key`) → bloqueos → límite de uso → sesión (JWT) → roles y 2FA → validación del cuerpo → permisos sobre el dato concreto (`OwnershipService`) → riesgo del inicio de sesión → revisión de archivos → detector de abuso. Detalle en [docs/SEGURIDAD.md](docs/SEGURIDAD.md).

- **Sesión:** access token JWT de 15 minutos y refresh token de un solo uso (7 días) que rota en cada renovación; en la web va en una cookie `httpOnly` y el access token vive solo en memoria. Si llega un refresh ya usado, se cierran todas las sesiones de la cuenta.
- **Entrar:** correo y contraseña (argon2id), **passkey** (huella, Face ID, Windows Hello) o Google. Segundo factor con app autenticadora (TOTP), códigos de respaldo o passkey; es **obligatorio** para admin, dueños y agencias (`SECOND_FACTOR_MODE`).
- **Riesgo del inicio de sesión:** se compara país, red y dispositivo con lo habitual de la cuenta; si es muy raro exige segundo factor. Cuenta bloqueada 15 minutos tras 5 contraseñas incorrectas.
- **El usuario siempre sale del token.** Ningún DTO acepta `userId`, `role`, `ownerId` ni `agencyId`; un campo desconocido responde 400. Un recurso ajeno responde 404 y queda auditado.
- **Datos cifrados en la base** (AES-256-GCM con claves versionadas `ENCRYPTION_KEYS`): datos personales del usuario, contacto y mensajes de las citas, textos reutilizables, datos de agencias, sesiones y auditoría. Los mensajes y los textos reutilizables además quedan **atados a su fila**: copiar el texto cifrado a otra fila no lo descifra. Las búsquedas por igualdad usan un índice ciego (HMAC). No es cifrado de extremo a extremo: el servidor descifra para mostrar.
- **Imágenes:** la subida pasa por el backend, que identifica el formato por sus primeros bytes, la decodifica y la vuelve a codificar con `sharp` (quita EXIF y GPS) y guarda tres variantes `.webp` (300×200, hasta 800×600 y hasta 1920×1440). El original va a un bucket **privado**; solo las variantes son públicas.
- **Almacenamiento:** interfaz `StorageProvider` con disco local o Supabase (`STORAGE_PROVIDER`).
- **Caché:** las respuestas del mapa y las búsquedas se guardan unos segundos (en memoria o en Redis con `CACHE_DRIVER`) y 1.000 clientes pidiendo el mismo mapa hacen una sola consulta. Una propiedad nueva puede tardar hasta unos 15 s en aparecer en el mapa público ([docs/RENDIMIENTO.md](docs/RENDIMIENTO.md)).
- **GraphQL** (`/api/graphql`) es **solo lectura** (búsqueda, ficha, mapa), con profundidad máxima 6 e introspección apagada en producción. Escribir es siempre REST.
- **Correo:** SMTP (Mailpit en local) o Resend guardado desde el panel de ajustes. Un fallo de envío se registra pero no rompe la operación.
- **Producción:** el servidor se niega a arrancar con secretos de desarrollo, claves cortas, orígenes `localhost` o un prefijo de admin obvio (`apps/api/src/config/production-guard.ts`).

---

## Stack

| Tema | Tecnología |
|---|---|
| Monorepo | pnpm workspaces (`apps/api`, `apps/web`, `packages/shared`) |
| API | NestJS 11, TypeScript, REST + GraphQL de lectura (Apollo), Swagger |
| Base de datos | PostgreSQL 17 con Prisma 6 (esquema y migraciones). Se usa la imagen `postgis`, pero hoy **no** se usa ningún tipo geográfico: la posición son `latitude` y `longitude` y el mapa filtra por caja visible. Supabase es opcional (solo como base de datos y almacenamiento) |
| Validación | `class-validator` en los DTO; Zod valida las variables de entorno |
| Seguridad | argon2, JWT, `helmet`, `@nestjs/throttler` (con Redis), `otplib` (TOTP), WebAuthn propio, `google-auth-library` |
| Archivos | `sharp` (imágenes), `exceljs` (importación) |
| Caché y límites | Redis (`ioredis`) o memoria |
| Web | Next.js 16 (App Router) y React 19, TypeScript |
| Datos en la web | TanStack Query |
| Estilos y animación | Tailwind 4 solo para el tema y utilidades; cada pantalla tiene su CSS acotado. Animaciones con `motion` |
| Mapa | MapLibre GL (estilo configurable con `NEXT_PUBLIC_MAP_STYLE_URL`) |
| Pruebas | Jest + Supertest (API), Vitest (web) |

---

## Estructura del repositorio

```
proyectoAlquiler/
  apps/
    api/            # NestJS: prisma/ (esquema, migraciones, seed), src/, test/ (e2e)
    web/            # Next.js
  packages/
    shared/         # enums compartidos (Role, PropertyStatus, AgencyMemberRole)
  scripts/          # .ps1 y .sh equivalentes a los scripts de pnpm
  docs/             # guías, seguridad, mapa de la API y diseño de origen
  docker/           # Dockerfile.dev
  eslint-rules/     # reglas propias del lint (límites entre módulos)
  docker-compose.yml
  .env.example
  README.md
```

### API: `apps/api/src/`

```
main.ts · app.module.ts
bootstrap/        # configuración común de la app (la usan main y las pruebas e2e)
config/           # ÚNICA capa que lee process.env (validada con Zod al arrancar)
common/           # infraestructura transversal: security, prisma, storage, files, crypto, graphql
support/          # envoltorios de paquetes de terceros: nadie importa el paquete directo
routes/           # un archivo de rutas por módulo, agrupadas bajo /api
modules/          # la lógica de negocio, un módulo por carpeta
```

Módulos: `auth`, `users`, `properties`, `agencies`, `appointments`, `reply-templates`, `imports`, `admin-users`, `settings`, `audit`, `security` y `health`.

### Backend: `apps/api/src/modules/<modulo>/`

> **Este es el sistema de trabajo del backend y debe reutilizarse tal cual en cualquier backend nuevo.** La guía para montarlo desde cero está en [docs/BACKEND-MODULAR.md](docs/BACKEND-MODULAR.md); las reglas detalladas, en [docs/CONVENCIONES.md](docs/CONVENCIONES.md); y la referencia viva es el módulo `apps/api/src/modules/properties` (cada carpeta tiene su README).

```
properties/
  properties.module.ts        # padre: registra todo
  index.ts                    # lo único que otros módulos pueden importar
  controllers/                # las rutas, separadas por QUIÉN puede usarlas
    public/                     sin sesión                      @PublicGroup()
    private/
      user/                     cualquier usuario autenticado   @AuthGroup()
      publisher/                propietario, agencia y admin    @PublisherGroup()
      admin/                    solo admin                      @AdminGroup()
  contracts/
    dto/                        lo que ENTRA (validación)
    resources/                  lo que SALE (una interface por respuesta)
  services/
    properties.service.ts       # fachada: los controllers solo hablan con ella
    catalog/ management/ images/ favorites/ access/   # un tema por carpeta, un archivo por caso de uso
  decorators/ utils/ tests/
```

- **Controller** sin lógica: recibe, llama a la fachada y devuelve su `Resource`. El grupo de acceso va en la clase y la carpeta debe coincidir (lo comprueba una prueba).
- **Validación** solo en `contracts/dto/`. **Lógica** solo en `services/`. **Respuestas** descritas en `contracts/resources/`, y las pruebas e2e comprueban que lo que sale las cumple (y rechazan campos que el Resource no declara).
- **Services** por tema y caso de uso (no por verbo); más de ~150 líneas se divide, y la fachada mantiene su API.
- **Permisos sobre datos:** cada módulo declara una política (`*.policy.ts`) y `OwnershipService.require` la aplica; quien no cumple recibe 404.
- **Paquetes de terceros solo vía `support/`** (`password`, `cache`, `mail`, `images`, `jwt`, `google-identity`, `totp`, `spreadsheet`, `db`): el lint falla si importas el paquete directo.
- **Imports:** `@/` = `src/` y `@test/` = `test/`; sin `../../..` (lo hace cumplir el lint). De otro módulo solo se importa su `index.ts`.
- **Rutas agrupadas:** `routes/api.routes` → `routes/<modulo>.routes`, con prefijos (`RouterModule` de Nest). Las rutas fijas (`mine`, `received`) se registran antes que `GET :id`.
- Cada carpeta lleva su `README.md`.

### Frontend: `apps/web/src/`

```
app/              # rutas de Next: cada page.tsx solo importa la página de su módulo
modules/          # una carpeta por tema (auth, home, map, properties, inbox, security, dashboard-agency, publish, admin, design)
lib/              # lo que comparten varios módulos: cliente HTTP (api.ts), properties/, appointments/, reply-templates/
support/          # envoltorios de paquetes: MotionSupport, QuerySupport, MapLibreSupport
components/       # piezas comunes: ui/ (Button, Field, Sheet...), icons/, Responsive
config/           # ÚNICA capa que lee process.env en la web, y la marca
```

```
inbox/                         # ejemplo: el módulo de mensajes
  index.ts                     # PADRE: único punto de importación del módulo
  README.md
  components/
    <Pagina>.tsx               # (si hay dos versiones) elige escritorio o móvil con <Responsive>
    <Pantalla>/                # el componente, sus partes con nombre y su .css
  hooks/                       # use<Pantalla>.ts: la lógica de cada pantalla
```

- Las páginas de `app/` solo importan desde `modules/<x>` (su `index.ts`), nunca archivos internos.
- Los componentes llevan poca lógica; la lógica va en `hooks/` y en `lib/`. **Máximo 600 líneas por archivo.**
- Escritorio y móvil se alternan por CSS con `<Responsive>`; hay pantallas que tienen una versión para cada uno y otras, como `inbox`, que son una sola adaptable.
- El cliente HTTP único es `lib/api.ts`: pone las cabeceras `x-app-*`, guarda el access token solo en memoria, hace **una** renovación a la vez y reintenta una vez.
- El color de marca y el modo noche viven en `app/globals.css` como variables CSS. El diseño de origen está en `docs/diseno/`; cómo leer el código, en [docs/GUIA-FRONTEND.md](docs/GUIA-FRONTEND.md).

### Variables de entorno

**Nadie lee `process.env` fuera de la capa `config/`** (regla de ESLint). La API la valida con Zod al arrancar y falla rápido con un mensaje claro si falta algo; los servicios reciben la configuración tipada por inyección y nunca el nombre de la variable. Renombrar una variable es editar solo `env.ts`. `.env.example` (raíz, `apps/api` y `apps/web`) documenta cada una y trae valores que ya funcionan. Las únicas variables que llegan al navegador son las `NEXT_PUBLIC_*`.

---

## Modelo de datos

`apps/api/prisma/schema.prisma` (22 modelos; el esquema no lleva lógica):

| Tema | Modelos |
|---|---|
| Cuentas y sesión | `User`, `SocialAccount`, `Session`, `TrustedDevice`, `LoginFootprint`, `VerificationCode`, `TwoFactorBackupCode`, `PasskeyCredential`, `PasskeyChallenge` |
| Agencias | `AgencyProfile`, `AgencyMember` |
| Propiedades | `Property`, `PropertyImage`, `Favorite` |
| Citas y mensajes | `Appointment`, `AppointmentMessage`, `AppointmentSlot`, `ReplyTemplate` |
| Importación | `ImportJob` |
| Seguridad y sistema | `BlockRule`, `AuditLog`, `PlatformSetting` |

`Property` guarda tipo (apartamento, casa, townhouse, habitación, local, oficina, galpón, terreno), estado, precio y moneda (USD o VES), habitaciones, baños, estacionamientos, área, amoblado, mascotas, ubicación (estado, municipio, urbanización, dirección, latitud y longitud), los cuatro servicios locales, `ownerUserId`, `agencyId`, `assignedAgentId` y `acceptsVisits`.

---

## Reglas de negocio

- **`PropertyStatus`:** `PUBLICADA`, `RESERVADA`, `ALQUILADA`, `PAUSADA`. Las transiciones se validan (por ejemplo, una pausada solo vuelve a `PUBLICADA`).
- Una propiedad **reservada no desaparece**: sigue en la búsqueda con la insignia "En proceso de reserva". Una pausada no existe para quien no la gestiona; una alquilada deja de aparecer en la búsqueda pero su ficha sigue abierta.
- Un apartado solo se pide sobre una propiedad `PUBLICADA`; una visita, pregunta o interés también sobre una `RESERVADA` si acepta citas.
- No se aceptan solicitudes duplicadas del mismo tipo sobre la misma propiedad mientras la anterior siga abierta, ni más de 10 pendientes por persona. Nadie puede escribirle a su propia propiedad.
- Una cuenta puede tener varios roles (`CLIENT` + `OWNER`).

---

## Pruebas

- **API:** pruebas unitarias junto a su código (`tests/` de cada módulo, 32 archivos) y **27 suites e2e** en `apps/api/test/e2e` (Supertest sobre una base real `alquiler_test`, creada y migrada sola; se niega a usar una base cuyo nombre no termine en `_test`). Necesitan solo PostgreSQL: `pnpm dev:db` y `pnpm test:e2e`.
- **Contrato de respuestas:** en las pruebas e2e, un interceptor lee el tipo de retorno de cada ruta y comprueba que la respuesta real lo cumple; una propiedad de más (por ejemplo una clave interna) hace fallar la prueba.
- **Web:** Vitest (`pnpm test:web`).
- Cada prueba e2e dice **qué prueba, qué espera y qué obtuvo** (`describeCase`), y el reporte lo imprime por módulo.
- El lint falla si hay `process.env` fuera de `config/`, archivos de más de 600 líneas, imports a archivos internos de otro módulo o paquetes de terceros fuera de `support/`.

---

## Seguridad

Resumen en "Cómo funciona por dentro"; el detalle, los límites conocidos y la lista previa a desplegar están en [docs/SEGURIDAD.md](docs/SEGURIDAD.md) y, para quien construye la web, en [docs/FRONTEND-SEGURIDAD.md](docs/FRONTEND-SEGURIDAD.md). Decisiones del proyecto: **sin servicios de terceros en la seguridad** (no hay CAPTCHA ni antivirus; los archivos pasan por revisiones propias). **No ha pasado una auditoría externa ni pruebas de penetración.**

---

## Documentación

| Documento | Para quién | Contenido |
|---|---|---|
| [docs/README.md](docs/README.md) | Todos | Índice de la documentación |
| [docs/GUIA-COLABORADORES.md](docs/GUIA-COLABORADORES.md) | Quien va a trabajar en el proyecto | Cómo levantarlo, comandos, estructura, migraciones y pruebas |
| [docs/SEGURIDAD.md](docs/SEGURIDAD.md) | Quien toque el backend | Capas de defensa, autenticación, datos, producción y límites |
| [docs/FRONTEND-SEGURIDAD.md](docs/FRONTEND-SEGURIDAD.md) | Quien construye la web o la app | Login, passkeys, segundo factor, errores por `code` |
| [docs/API.md](docs/API.md) | Frontend, móvil y revisores | Todas las rutas y quién puede usarlas |
| [docs/RENDIMIENTO.md](docs/RENDIMIENTO.md) | Quien optimiza | Caché, límites y sus límites honestos |
| [docs/BACKEND-MODULAR.md](docs/BACKEND-MODULAR.md) | Quien monta un backend | El sistema modular y cómo repetirlo |
| [docs/CONVENCIONES.md](docs/CONVENCIONES.md) | Todos | Reglas de arquitectura y estilo |
| [docs/GUIA-FRONTEND.md](docs/GUIA-FRONTEND.md) | Frontend | De la URL a la pantalla |
| [docs/diseno/README.md](docs/diseno/README.md) | Frontend | Diseño de origen y decisiones |

Cada módulo y carpeta de código tiene además su propio `README.md`. **Regla:** si cambias algo documentado, actualiza el documento en el mismo cambio.

---

## Siguientes pasos

1. **Conectar a la API** el panel de inmobiliaria (`/panel/*`) y publicar (`/publicar`), que hoy usan datos de ejemplo; y decidir si la moderación de anuncios de `/admin` se construye en la API o se retira de la pantalla.
2. Cola de trabajos para los correos y tareas pesadas.
3. Tasa del dólar y conversión a bolívares.
4. App móvil (Expo), reutilizando `packages/shared`.
5. Probar Google y Supabase con credenciales reales y activar PostGIS si el volumen de pines lo pide.
6. Auditoría externa de seguridad antes del lanzamiento público.
7. Definir nombre, dominio y marca de la plataforma.
