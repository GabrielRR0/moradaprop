# Seguridad

Lee esto **antes de tocar el backend**. Explica qué protege cada pieza, por qué existe y qué reglas debes seguir para no romperla. Si algo de aquí no coincide con el código, el código manda: corrige este documento en el mismo cambio.

> Estado: diseñado e implementado con pruebas automáticas (ver [Dónde están las pruebas](#dónde-están-las-pruebas-de-seguridad)). **No ha pasado una auditoría externa ni pruebas de penetración.** Que pase las pruebas no significa que sea invulnerable.

## 1. Principios

1. **Todo se niega por defecto.** Una ruta exige sesión salvo que se marque pública a propósito (`@PublicGroup` / `@GuestGroup`). Un contexto desconocido (ni REST ni GraphQL) se rechaza.
2. **Nunca se confía en lo que manda el cliente.** El usuario, su rol, su agencia y el dueño de una propiedad salen del **token**, jamás del body, la URL o un parámetro. Ninguna ruta recibe `userId`, `ownerId` o `agencyId`.
3. **Se valida todo lo que entra y se limita todo lo que sale.** DTOs estrictos de entrada; respuestas armadas a mano, sin campos internos.
4. **Un fallo de seguridad no debe revelar información.** Mismo mensaje si el correo existe o no; mismo tiempo de respuesta; errores sin trazas.
5. **Lo sensible nunca se guarda en claro.** Contraseñas con argon2id; tokens y códigos como hash; secretos del 2FA cifrados.
6. **En producción el sistema se niega a arrancar si está mal configurado** (ver §7).

## 2. Capas de defensa (en el orden en que actúan)

Cada petición, REST o GraphQL, pasa por esta cadena. Está declarada en `apps/api/src/common/security/global-guards.module.ts`.

| # | Capa | Archivo | Qué hace |
|---|---|---|---|
| 1 | Origen de la app | `common/security/guards/app-origin.guard.ts` | Rechaza si el `Origin` no está en `CORS_ALLOWED_ORIGINS` o si falta/no coincide `X-App-Client` + `X-App-Key`. |
| 2 | Bloqueos | `modules/security/guards/block.guard.ts` | Rechaza IPs, rangos CIDR y países bloqueados (panel admin). |
| 3 | Límite de peticiones | `common/security/app-throttler.guard.ts` + `rate-limits.ts` | 429 si una IP se pasa del límite de su tipo de ruta. |
| 4 | Sesión | `modules/auth/guards/jwt-auth.guard.ts` | Exige token válido salvo rutas públicas; comprueba que el usuario no esté bloqueado. |
| 5 | Roles y 2FA | `common/security/guards/roles.guard.ts` | Aplica `@Roles(...)` y `@RequireTwoFactor()`. |
| 6 | Validación | `bootstrap/configure-app.ts` (ValidationPipe) | Rechaza campos desconocidos y datos inválidos. |
| 7 | Permisos de datos | `modules/security/ownership/` + `*-policy.service.ts`, `*.policy.ts` | Decide si **este** usuario puede tocar **este** recurso (`OwnershipService.require`). Un recurso ajeno responde 404 y queda auditado (`access.denied`). |
| 8 | Revisión de archivos | `modules/security/threat-model/file-checks/` | Antes de guardar o decodificar un archivo subido: nombre peligroso (doble extensión, `.php`, `.exe`…) y programas o scripts disfrazados de imagen o planilla. Código propio, sin servicios ni paquetes externos. |
| 9 | Modelo de amenazas (STRIDE) | `modules/security/threat-model/` | Observa las respuestas (401, 400, 404, 429, 403) y, si alguien insiste, lo audita y (con `THREAT_MODE=enforce`) lo bloquea por tiempo. Un escudo por letra STRIDE. |

> **Toda la seguridad vive en `modules/security`**, dividida en mini módulos privados (`blocks`, `ownership`, `threat-model`). El resto de la app solo importa `modules/security` (su `index.ts`). Ver `apps/api/src/modules/security/README.md`.

> **Importante:** los roles (capa 5) dicen *qué tipo de usuario* eres; la capa 7 dice *si ese recurso concreto es tuyo*. Tener rol OWNER no te deja editar la propiedad de otro. Nunca confíes solo en `@Roles`.

### Grupos de rutas

Se declaran en `common/security/groups/index.ts`. Elige el grupo correcto en cada controller:

| Grupo | Cuándo usarlo | Límite por minuto |
|---|---|---|
| `PublicGroup` | Lectura pública (búsqueda, mapa, fichas) | 120 |
| `GuestGroup` | Sin sesión pero sensible (login, registro, códigos, recuperar clave) | 10 |
| `AuthGroup` | Cualquier usuario con sesión | 120 |
| `RoleGroup(roles…)` | Sesión + algún rol | 120 |
| `TwoFactorGroup` | Sesión + 2FA verificado | 120 |
| `AdminGroup` | Panel de administración: rol ADMIN **y** 2FA | 120 |

## 3. Autenticación

- **Contraseñas:** argon2id (`common/password`). Política: 8–128 caracteres con letras y números. Si el usuario no existe se ejecuta igual una verificación falsa para que el tiempo de respuesta no delate qué correos están registrados.
- **Access token:** JWT de vida corta (15 min por defecto, `JWT_ACCESS_EXPIRES_IN`). Lleva `sub`, `roles`, `sid` (sesión) y `twoFactor`.
- **Refresh token:** aleatorio, de **un solo uso** y rotativo (7 días). Se guarda solo su hash. **Si llega uno ya usado hace más de 10 s (posible robo) se cierran todas las sesiones del usuario.** Dentro de esos 10 s (dos pestañas o un reintento de red que refrescan a la vez) solo se rechaza con 401 sin cerrar nada, y la rotación es atómica: si varias peticiones llegan con el mismo token, una sola gana y no se crean sesiones de más. Web: cookie `httpOnly`, `sameSite=lax`, `secure` en producción, ruta `/api/auth`; el JavaScript de la página no puede leerlo. Móvil: viaja en el body.
- **Bloqueo de cuenta:** 5 contraseñas incorrectas seguidas bloquean la cuenta 15 minutos (`auth.config.ts`).
- **Códigos de 6 dígitos** (verificar correo, recuperar clave, 2FA por correo, vincular Google): se guardan como HMAC con contexto (usuario + tipo, no sirven en otro lado), vencen en 10 min, permiten 5 intentos y no se pueden pedir más de uno por minuto.
- **No se revela si un correo existe:** registro, reenvío y recuperar clave responden igual.
- **Cambio o recuperación de contraseña** cierra las demás sesiones.

### 2FA (verificación en dos pasos)

- TOTP (app autenticadora). El secreto se guarda **cifrado** (AES-256-GCM con `ENCRYPTION_KEY`).
- **Anti-repetición:** un mismo código TOTP no se acepta dos veces (se guarda el último paso usado).
- 8 códigos de respaldo de un solo uso, guardados como hash. También se puede recibir un código por correo.
- Para desactivarlo o regenerar respaldos se pide la contraseña (si la cuenta tiene) y un código válido.
- El **panel de administración exige 2FA activo**. Un admin sin 2FA recibe `TWO_FACTOR_REQUIRED`.
- Los administradores **no se crean por la API pública**: el registro solo permite CLIENT, OWNER y AGENCY.

### Google

- Se valida el `idToken` contra el cliente de Google (`GOOGLE_CLIENT_ID`) y se exige correo verificado.
- **Un correo que ya tiene cuenta NO se vincula automáticamente:** se envía un código a ese correo y hay que confirmarlo. Así nadie toma una cuenta ajena solo por tener el mismo correo en Google.
- No se puede desvincular Google si la cuenta no tiene contraseña (quedaría sin forma de entrar).

## 4. Datos y permisos

- **Entrada:** `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`. Si el cliente manda un campo que el DTO no declara (`role`, `ownerUserId`, `status`…) la petición falla con 400. Esto es lo que impide la "asignación masiva".
- **Salida:** los `*-mapper.ts` arman cada respuesta. Nunca devuelvas una fila de Prisma tal cual. Los tipos GraphQL son una ventana de lo público: campos como `ownerUserId` o las claves de storage **ni existen** en el esquema, así que no se pueden pedir.
- **Propiedades:** `property-policy.service.ts` define quién gestiona qué (dueño, administrador de agencia, agente asignado, admin). Una propiedad pausada no existe para quien no la gestiona (404, no 403, para no confirmar que existe).
- **Agencias:** la agencia sale de la cuenta del usuario, no de la URL. Los límites del plan (`maxProperties`, `maxAgents`) no son editables por la agencia.
- **Invitaciones de agencia:** token aleatorio de un solo uso; solo se guarda su hash; solo la cuenta con el **correo invitado ya verificado** puede aceptarla.
- **Citas:** el solicitante sale del token; el dueño ve los datos de contacto del lead, el cliente no ve los del dueño.
- **Auditoría** (`modules/audit`): quién, qué y desde dónde. `utils/sanitize.ts` redacta contraseñas, tokens, códigos y secretos **antes** de guardar. Si añades un campo sensible con otro nombre, agrégalo al patrón de ese archivo.
- **Bloqueos** (`modules/security`): por IP, CIDR, país, usuario, correo y dominio. Un usuario bloqueado pierde acceso en la siguiente petición.
- **Suspender una cuenta** (`modules/admin-users`) hace tres cosas: cambia su estado, **cierra todas sus sesiones** y le pone un **bloqueo de usuario**, así que el token que ya tenía deja de servir al instante. Reactivar quita el bloqueo. Se registra en la auditoría.

### Cifrado de datos personales en la DB
Mini módulo `security/encryption`. Los datos personales se guardan como `v<N>.iv.tag.dato` (AES-256-GCM, el campo va como AAD) y las búsquedas por igualdad usan un índice ciego (HMAC, clave distinta a la de cifrado). Claves en `ENCRYPTION_KEYS` (`v1:...,v2:...`); para rotar se agrega una versión nueva y se re-cifra lo antiguo. En `User` ya van cifrados `email`, `name`, `phone` y el secreto 2FA; el admin busca por texto parcial con tokens ciegos (HMAC de prefijos). **Respalda las claves aparte de la DB:** sin ellas los datos no se recuperan.

## 5. Archivos e importaciones

Nunca se confía en la extensión ni en el `Content-Type` que manda el cliente.

- **Imágenes** (`common/files`, `common/images`): se identifica el formato por sus primeros bytes (JPG/PNG/WebP), se **decodifica y se vuelve a codificar** con sharp (destruye código incrustado y archivos "políglota"), se corrige la orientación y se **elimina el EXIF/GPS**. Máx. 10 MB, mín. 200 px, 20 imágenes por propiedad, 10 por petición. Si una de varias imágenes es inválida **no se guarda ninguna**.
- **Almacenamiento** (`common/storage`): dos buckets. El **público** solo contiene las variantes (thumb/medium/hd). El **original y las planillas** van al **privado** y nunca se sirven por URL. Los nombres son UUID generados por el servidor y las rutas se validan contra *path traversal*.
- **Planillas Excel/CSV** (`modules/imports`): solo agencias; 5 MB y 500 filas; se rechaza `.xlsm` con macros, los *zip bombs* (se lee el directorio del zip sin descomprimir) y las **celdas con fórmulas**. Los textos que empiezan con `=`, `+`, `-` o `@` se neutralizan para evitar *inyección de fórmulas* cuando alguien exporte los datos a Excel. Cada fila se valida con las mismas reglas que publicar a mano.
- Todos los uploads usan memoria (`multer` sin `storage`): nada toca el disco hasta validar el contenido.

## 6. GraphQL

Misma puerta, mismas protecciones: usa los mismos guards globales (origen, bloqueos, rate limit, JWT, roles) y los mismos servicios que REST. Además: profundidad máxima de 6 niveles (`common/graphql/graphql-limits.ts`), introspección apagada en producción, sin trazas de error. **GraphQL es solo de lectura**; escribir es siempre REST.

## 7. Producción

### El servidor no arranca con configuración insegura
`apps/api/src/config/production-guard.ts` se ejecuta al cargar la configuración. Con `NODE_ENV=production` **falla** si:
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` o `ENCRYPTION_KEY` son valores de desarrollo (`dev-…`, `…change-me…`) o tienen menos de 32 caracteres;
- los dos JWT son iguales;
- `APP_CLIENT_KEY_WEB` / `APP_CLIENT_KEY_MOBILE` son valores de desarrollo;
- `CORS_ALLOWED_ORIGINS` apunta a `localhost`.

Las claves de desarrollo están en el repositorio (`docker-compose.yml`, `.env.example`), o sea, son públicas.

### Lista antes de desplegar
- [ ] `NODE_ENV=production`.
- [ ] Secretos generados aleatoriamente (mínimo 32 caracteres): `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (distintos entre sí), `ENCRYPTION_KEY`.
- [ ] `ENCRYPTION_KEY` respaldada en un gestor de secretos. **Si se pierde o cambia, todos los 2FA activos dejan de funcionar** (el secreto no se puede descifrar).
- [ ] `APP_CLIENT_KEY_*` propias y `CORS_ALLOWED_ORIGINS` con el dominio real.
- [ ] `TRUST_PROXY=true` **solo si** el API está detrás de un proxy/CDN de confianza. Con `true` sin proxy, cualquiera falsifica su IP con `X-Forwarded-For` y evade bloqueos y límites. Con `false` detrás de un proxy, todos los usuarios parecen tener la IP del proxy y se limitan entre sí.
- [ ] `THREAT_MODE=enforce` (empieza unos días en `monitor`, revisa `GET /api/admin/audit?action=threat.` y ajusta los límites de `threat-model/shields/` antes de activar el bloqueo automático).
- [ ] `CACHE_DRIVER=redis` si hay más de un servidor (si no, cada uno cuenta sus límites por separado).
- [ ] HTTPS en todo el recorrido (la cookie `secure` solo viaja por HTTPS).
- [ ] CDN/WAF delante (ej. Cloudflare): es la defensa real contra tráfico masivo; ver `docs/RENDIMIENTO.md`.
- [ ] Base de datos con respaldos automáticos y acceso restringido. Migraciones solo con `pnpm db:deploy` (el guardián bloquea `reset`/`push` en producción o contra bases remotas).
- [ ] `STORAGE_PROVIDER=supabase` con la **service key solo en el servidor**; bucket `property-media` público y `private-files` **privado**.
- [ ] Swagger (`/docs`) e introspección GraphQL se apagan solos en producción: verifica que sigan apagados.
- [ ] Un administrador creado a mano con 2FA activado; sin las cuentas demo (`*@demo.local`).
- [ ] Correo real configurado (`MAIL_*`); verifica SPF/DKIM del dominio para que los códigos no caigan en spam.

## 8. Reglas para quien programa

### Al crear un endpoint
1. Elige el **grupo** de rutas correcto (§2). Si dudas, usa `AuthGroup`: es más estricto que público.
2. El usuario sale de `@CurrentUser()`. **Nunca** pidas `userId`, `ownerId`, `agencyId` ni `role` en el body, la URL o la query.
3. Crea un **DTO** con validadores para cada campo y deja que el pipe rechace lo desconocido. Pon límites (`@MaxLength`, `@Max`) a todo: texto, números y listas.
4. Valida **pertenencia**, no solo rol: ¿este recurso es de este usuario? Pide el recurso con `ownership.require(policy, user, id, 'accion', ctx)` (ver `modules/security/ownership/README.md`); si no es suyo responde 404 y queda auditado. Los listados filtran por dueño en el `where`.
8. Si el endpoint recibe archivos, llama a `threats.inspectFiles(...)` (`ThreatModelService`) **antes** de guardarlos o procesarlos.
5. Devuelve datos con un **mapper**, no la fila de la base. Revisa que no salgan hashes, tokens, correos de terceros ni ids internos.
6. Si cambia datos importantes, registra en auditoría (`@Audit(...)` o `AuditService.log`). No metas secretos en `metadata`.
7. Rutas costosas (subir archivos, importar, búsquedas pesadas) llevan su propio límite en `rate-limits.ts`.
8. Escribe pruebas e2e de **lo que no debe pasar**: sin token, con otro usuario, con campos prohibidos, con datos inválidos.

### Prohibido
- Concatenar texto en SQL. Usa Prisma o `$queryRaw` con parámetros (`Prisma.sql`), jamás `$queryRawUnsafe` con datos del usuario.
- Leer `process.env` fuera de `config/` (el lint lo impide).
- Guardar o registrar en logs contraseñas, tokens, códigos, claves o datos de tarjetas.
- Devolver mensajes distintos según si un usuario/correo existe.
- Confiar en `X-Forwarded-For`, `Origin` o `X-App-Key` como prueba de identidad: son **filtros**, no autenticación.
- Subir `.env`, claves o la carpeta `uploads/` al repositorio.
- Desactivar un guard, el `ValidationPipe` o una regla de lint "para que pase". Si algo estorba, se discute y se cambia la regla.
- Usar `any` o `@ts-nocheck` para saltarse el tipado en el backend.
- Editar una migración ya aplicada, o cambiar tablas a mano en una base compartida.

### Dependencias
- Antes de agregar una librería: ¿está mantenida?, ¿cuántas dependencias arrastra?, ¿hace falta de verdad?
- Versiones fijadas a propósito están en `docs/CONVENCIONES.md` §9.
- Ejecuta `pnpm audit` antes de cada despliegue y revisa lo crítico.

## 9. Límites conocidos (sé honesto con estos)

| Limitación | Efecto | Mitigación / siguiente paso |
|---|---|---|
| Un access token no se puede revocar antes de vencer (15 min) | Salvo por **suspensión** o **bloqueo de usuario** (que sí lo cortan al instante), un token ya emitido sigue valiendo hasta vencer. Ej.: si alguien cambia su contraseña por sospecha de robo, un token robado sigue sirviendo hasta 15 min | Acortar `JWT_ACCESS_EXPIRES_IN` si hace falta; los cambios de contraseña ya cierran los refresh tokens |
| Los bloqueos se guardan 30 s en la memoria de cada servidor | Con varios servidores, un bloqueo nuevo puede tardar hasta 30 s en llegar a los demás (en el que lo creó es inmediato) | Pasar el caché de bloqueos a Redis si molesta |
| `X-App-Key` de la web es visible en el navegador | Sirve para filtrar tráfico ajeno, no para detener a un atacante decidido | Rate limit + CDN/WAF |
| El límite de peticiones es por IP | Muchas personas tras un mismo NAT comparten límite; un atacante con muchas IPs lo esquiva | CDN/WAF; límites por usuario cuando hay sesión |
| La caché pública se renueva por tiempo | Una propiedad nueva puede tardar hasta 15 s en el mapa público | Ver `docs/RENDIMIENTO.md` |
| No hay CAPTCHA (decisión del proyecto: sin servicios de terceros) | Un atacante que rota de IP (proxies, IPv6) puede crear cuentas sin que ninguna IP llegue al umbral del escudo `mass-registration` (8 por hora); cada cuenta igual necesita un correo real que reciba el código | Bloqueos por correo y por dominio (admin); revisar `threat.detected` y las altas por hora; límites por dispositivo si hay abuso |
| No se valida que el dominio del correo reciba correos | Se pueden registrar correos inexistentes (no podrán verificar) | Bloqueos por dominio ya disponibles |
| No hay antivirus (decisión del proyecto: sin servicios de terceros en la seguridad) | Los archivos pasan por revisiones propias (nombre, ejecutables, magic bytes, zip-bombs, macros) y las imágenes se re-codifican; un virus conocido dentro de una planilla válida no se detecta por firma | Los originales y planillas viven en un bucket privado y nunca se sirven ni se ejecutan |
| Los contadores del modelo de amenazas viven en la memoria de cada servidor | Con varios servidores cada uno cuenta aparte, así que el umbral efectivo se multiplica | Reemplazar `threat-ledger.service.ts` por una versión con Redis (misma interfaz) |
| Los escudos miran el código HTTP | En GraphQL los errores suelen responder 200 y no cuentan (sí cuentan los que cortan los guards o el rate limit) | Reportar con `ThreatModelService.report(...)` desde el resolver si hace falta |
| Sin auditoría externa ni pentest | — | Hacerlo antes del lanzamiento público |

## 10. Dónde están las pruebas de seguridad

Corren con `pnpm test:e2e` (base de datos real de pruebas) y `pnpm test:api`.

| Qué se prueba | Archivo |
|---|---|
| Origen de la app, registro sin enumerar cuentas, refresh rotativo (reuso inmediato tolerado, robo tardío cierra todo, 8 refresh simultáneos = 1 ganador), datos sensibles fuera de la auditoría | `test/e2e/auth-registro.e2e-spec.ts` |
| Modelo de amenazas: archivos maliciosos, `access.denied`, bloqueo automático por 403 repetidos | `test/e2e/amenazas.e2e-spec.ts` |
| Registro masivo: la IP que crea 8 cuentas queda bloqueada | `test/e2e/registro-masivo.e2e-spec.ts` |
| Recuperar contraseña, bloqueo de cuenta | `test/e2e/auth-recuperacion.e2e-spec.ts` |
| Perfil: no se pueden cambiar roles/correo; cambio de contraseña cierra otras sesiones; suspender corta el acceso al instante | `test/e2e/usuarios.e2e-spec.ts` |
| 2FA: TOTP, anti-repetición, respaldos de un solo uso, desactivar | `test/e2e/auth-2fa.e2e-spec.ts` |
| Google: no vincula sin código, no se roba una cuenta | `test/e2e/auth-google.e2e-spec.ts` |
| Panel admin exige rol + 2FA, bloqueos, auditoría | `test/e2e/admin-seguridad.e2e-spec.ts` |
| Límite de peticiones (429) | `test/e2e/rate-limit.e2e-spec.ts` |
| Permisos de propiedades, archivos falsos, rutas privadas, path traversal | `test/e2e/propiedades-publicar.e2e-spec.ts` |
| Agencias: invitaciones, permisos por rol, límites de plan | `test/e2e/agencias.e2e-spec.ts` |
| Citas: quién ve qué, carreras de apartados | `test/e2e/citas.e2e-spec.ts` |
| Importación: macros, fórmulas, filas inválidas, límites | `test/e2e/importacion*.e2e-spec.ts` |
| GraphQL: mismos guards, esquema sin datos internos, profundidad | `test/e2e/graphql.e2e-spec.ts` |
| Caché y topes de paginación | `test/e2e/rendimiento.e2e-spec.ts` |
| Configuración insegura en producción | `src/config/tests/env.spec.ts` |
| Cifrado, hashes, comparación en tiempo constante | `src/common/crypto/tests/` |
| Firmas de archivo y zip bombs | `src/common/files/tests/` |
| Procesado de imágenes (EXIF, poliglotas) | `src/common/images/tests/` |
| Guardián de migraciones | `src/database/tests/` |


## 11. Reportar una vulnerabilidad

**Pendiente de definir** (correo o canal privado del equipo). Mientras tanto: **no abras un issue público con detalles de una falla**; avisa directamente al responsable del proyecto. Si encuentras un secreto real en el repositorio, trátalo como filtrado: se rota, no solo se borra.
