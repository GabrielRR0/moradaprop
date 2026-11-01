# Despliegue en Vercel (monorepo con Services)

La web y la API se despliegan como **un solo proyecto de Vercel** con el preset **Services**: comparten el dominio (`https://<proyecto>.vercel.app`), así que la cookie de sesión funciona sin comprar un dominio y no hace falta CORS.

> **Estado:** configurado según la documentación de Vercel Services, pero **todavía no se ha desplegado**. Lo que se verificó localmente: el build de la web y la compilación de la API. Lo demás (que la API arranque como función, Prisma en el runtime, las variables) se ajusta con los registros del primer despliegue. Services está en **Beta**.

## Cómo está armado
`vercel.json` (en la raíz):

| Servicio | Carpeta | Ruta pública | Qué es |
|---|---|---|---|
| `web` | `apps/web` | `/` (todo lo demás) | Next.js |
| `api` | `apps/api` | `/api/...` | NestJS, como una Vercel Function (Fluid compute) |

- **El prefijo no se quita:** Vercel entrega a la API la ruta original (`/api/auth/login` llega como `/api/auth/login`), y las rutas de la API ya empiezan por `/api`. No hay nada que reescribir.
- **No hay bindings:** la web llama a la API desde el navegador (mismo dominio); ningún servicio llama a otro desde el servidor.
- **La API arranca con `src/main.ts`** (`app.listen`), el punto de entrada que Vercel detecta para NestJS. Antes de compilar se genera el cliente de Prisma (`buildCommand` del servicio `api`).
- **La web llama a `/api` sin configurar nada:** en producción, sin `NEXT_PUBLIC_API_URL`, `publicEnv.apiUrl` es vacío (mismo dominio). En desarrollo sigue siendo `http://localhost:3001`.

## Pasos
1. **Base de datos y fotos en Supabase** (guía en la conversación de Supabase del proyecto): `pnpm db:deploy` contra Supabase, Data API desactivada, y dos buckets en Storage: `property-media` (público) y `private-files` (privado).
2. En Vercel: **New Project** → el repositorio → Root Directory `./`, preset **Services**. Debe detectar `vercel.json`.
3. **Environment Variables:** con Services hay **una sola lista para los dos servicios**. Pon todo lo de abajo.
4. Deploy. Prueba `https://<proyecto>.vercel.app/api/health` y luego la web.
5. Las migraciones de Prisma **no** corren en el despliegue: se aplican a mano con `pnpm db:deploy`.

## Variables de entorno
Las `NEXT_PUBLIC_*` son de la web y **terminan visibles en el navegador**; todas las demás son de la API. Con `NODE_ENV=production` (Vercel lo pone) el servidor **no arranca** con valores de desarrollo.

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Pooler de transacciones de Supabase (puerto 6543) con `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Pooler de sesión de Supabase (puerto 5432) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY` | Propios, aleatorios, de 32+ caracteres (los dos JWT distintos). **Respalda la `ENCRYPTION_KEY`** |
| `APP_CLIENT_KEY_WEB`, `APP_CLIENT_KEY_MOBILE` | Propias. `NEXT_PUBLIC_APP_CLIENT_KEY` debe valer **lo mismo** que `APP_CLIENT_KEY_WEB` |
| `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `API_PUBLIC_URL` | `https://<proyecto>.vercel.app` |
| `WEBAUTHN_RP_ID` | `<proyecto>.vercel.app` (sin `https://`) |
| `WEBAUTHN_ORIGINS` | `https://<proyecto>.vercel.app` |
| `ADMIN_API_PREFIX` | Un nombre propio y poco obvio (8+ caracteres) |
| `NEXT_PUBLIC_ADMIN_API_PREFIX` | **El mismo valor** que `ADMIN_API_PREFIX` (la pantalla de ajustes de la web lo necesita para llamar a la API; es visible en el navegador) |
| `TRUST_PROXY` | `true` (Vercel es el único que entra) |
| `STORAGE_PROVIDER` | `supabase`, con `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` (secreta) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | Un SMTP real (sin él nadie puede registrarse: el código llega por correo). Después, el admin puede guardar Resend cifrado desde la web y eso **manda sobre** estas variables (ver abajo) |
| `NEXT_PUBLIC_USE_MOCKS` | `false` |
| `NEXT_PUBLIC_SHOW_THEME_PICKER` | `false` |
| `NEXT_PUBLIC_API_URL` | **No la pongas** (mismo dominio) |
| `TURNSTILE_ENABLED`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Opcional (ver `docs/SEGURIDAD.md`) |

Las URLs de las *previews* de Vercel son otros dominios: ahí el origen no estará en `CORS_ALLOWED_ORIGINS` y la API rechazará las peticiones. El login y la API se prueban en el dominio de producción.

## Crear el administrador y configurar el correo
Al admin **no** se le crea por la web: se registra como una persona normal y tú le cambias el rol en la base.

1. Regístrate en `/registro` como cliente con tu correo.
2. En Supabase → **SQL Editor** busca tu usuario (el correo está cifrado, así que se busca por fecha) y cámbiale el rol:
   ```sql
   select id, "createdAt", "emailVerifiedAt", roles from "User" order by "createdAt" desc limit 5;
   update "User" set roles = array['CLIENT','ADMIN']::"Role"[] where id = 'EL-ID-DE-TU-USUARIO';
   ```
   Si aún no hay correo configurado y no te llega el código, verifícalo a mano (así el primer admin no depende del correo):
   ```sql
   update "User" set "emailVerifiedAt" = now() where id = 'EL-ID-DE-TU-USUARIO';
   ```
3. **Cierra sesión y vuelve a entrar** (el rol viaja en el token).
4. Activa la **verificación en dos pasos** (app autenticadora o huella) en `/seguridad/activar`: el panel de admin la exige.
5. Entra a **`/admin/ajustes`** (también hay un botón "Ajustes" en el inicio para admins). Ahí guardas la **API key de Resend**, el **correo remitente** y el **nombre**, y envías un correo de prueba.

**Qué manda sobre qué:** si hay una clave de Resend guardada en la plataforma, el correo sale por Resend; si no, por las variables `MAIL_*` del servidor. Todo lo guardado desde la pantalla va **cifrado** en la base (con tu `ENCRYPTION_KEY`). Guardar o quitar pide volver a confirmar el segundo factor (si pasaron más de 5 minutos).

## Límites de las funciones de Vercel que afectan a este proyecto
- **4,5 MB por petición** (cuerpo): la API acepta fotos de hasta 10 MB y hasta 10 por petición, así que una subida grande fallaría con 413. Para fotos reales hará falta reducirlas en el navegador o subir directo a Supabase con una URL firmada. La pantalla de publicar todavía no sube fotos (usa datos de ejemplo), por eso hoy no estorba.
- **Disco de solo lectura y efímero:** por eso las fotos van a Supabase Storage y no a disco.
- **Límites de uso, detector de abuso y caché en memoria** (`CACHE_DRIVER=memory`, el valor por defecto): cada instancia lleva sus propios contadores y se reinician con cada arranque en frío. Para que valgan entre instancias usa Redis (`CACHE_DRIVER=redis` y `REDIS_URL`, por ejemplo Upstash). Con Turnstile activo el riesgo de creación masiva de cuentas baja mucho.
- **Arranque en frío:** la primera petición tras un rato sin tráfico tarda más (Nest + Prisma).
- **Duración máxima 300 s, memoria 2 GB, paquete de 250 MB** en el plan Hobby.
- **Conexiones a la base:** usa el pooler (puerto 6543) y `connection_limit=1`; si no, cada instancia abre demasiadas.

## Si el primer despliegue falla
Casi siempre es uno de estos, y se ve en **Deployments → el despliegue → Logs**:
- **La API no arranca:** el registro dirá qué variable falta o es de desarrollo (`production-guard.ts` lo explica).
- **Prisma no encuentra su motor** (`Query engine library ... rhel-openssl-3.0.x`): agrega `binaryTargets = ["native", "rhel-openssl-3.0.x"]` al `generator client` de `apps/api/prisma/schema.prisma`.
- **404 en toda la API:** revisa que el servicio `api` esté detectado como NestJS y que `/api/health` responda.
- **Mapa en blanco:** el worker de MapLibre (`/maplibre/[file]`) lee archivos de `node_modules`; el build lo incluye, pero conviene abrir `/mapa` y comprobarlo.
