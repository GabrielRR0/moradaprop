# threat-model
Mini módulo de `security`: modelo de amenazas basado en **STRIDE** (el marco de Microsoft para pensar qué puede salir mal). Detecta ataques por su comportamiento, deja constancia y, si se activa, bloquea al atacante por un tiempo. También revisa los archivos que suben los usuarios.

| Letra | Amenaza | Cómo la cubre este módulo |
|---|---|---|
| **S** | Spoofing (suplantación) | Escudos `credential-guessing` (muchos 401), `mass-registration` (muchas cuentas nuevas desde una IP) y `account-takeover-attempt` (cuentas bloqueadas por fallar el segundo factor desde un lugar raro; lo alimenta `access-risk`) |
| **T** | Tampering (manipulación) | Escudos `payload-tampering` (muchos 400) y `malicious-upload`; revisiones de archivos |
| **R** | Repudiation (repudio) | Escudo `audit-trail` (documenta que todo queda auditado); cada detección y rechazo se registra con usuario e IP |
| **I** | Information disclosure (filtración) | Escudo `id-enumeration`: muchos 404 (recorrido de ids; ver `ownership`) |
| **D** | Denial of service | Escudo `request-flood`: insiste después de recibir 429 |
| **E** | Elevation of privilege | Escudo `privilege-probing`: muchos 403 (rutas de admin o de otro rol) |

## Dos tipos de mini módulos
- **Escudos** (`shields/`): vigilan el tráfico. Cada uno es un archivo corto que declara qué respuestas cuenta (`matches`), cuántas en cuántos segundos (`limit`, `windowSec`) y cuánto dura el bloqueo (`blockMinutes`). Ver [shields/README.md](shields/README.md).
- **Revisiones de archivo** (`file-checks/`): inspeccionan un archivo subido antes de guardarlo (nombre peligroso, programa o script disfrazado). Ver [file-checks/README.md](file-checks/README.md).

Cada tipo tiene **una sola lista** (`shields/index.ts`, `file-checks/index.ts`): agregar uno es crear su archivo y sumar una línea; quitarlo es borrarla.

## Cómo funciona
1. `middleware/threat-observer.ts` (se registra en `bootstrap/configure-app.ts`) mira cada respuesta cuando termina, incluidas las que cortan los guards (401, 403, 429). Nunca cambia ni retrasa la respuesta.
2. `ThreatModelService.observe` se la pasa a los escudos; los que la reconocen la cuentan en `ThreatLedgerService` (ventana deslizante, por usuario o por IP si no hay sesión).
3. Al llegar al límite, `ThreatResponseService` audita `threat.detected` y, en modo `enforce`, bloquea al usuario (o a su IP) con vencimiento usando `blocks`. Los administradores nunca se bloquean solos.
4. Los servicios que reciben archivos llaman `ThreatModelService.inspectFiles(files, sujeto)` **antes** de guardar o decodificar. Si algo falla: 400 genérico ("rechazado por seguridad", sin decir por qué), auditoría `threat.file.rejected` y se cuenta en `malicious-upload`. Si una revisión falla al ejecutarse: 503 y el archivo **no** pasa.
5. Un servicio puede reportar un hecho propio con `ThreatModelService.report('<id-del-escudo>', sujeto)`.

## Modos (`THREAT_MODE`)
| Modo | Qué hace |
|---|---|
| `off` | No vigila ni revisa archivos |
| `monitor` (por defecto) | Detecta y audita, **no bloquea**. Úsalo unos días en producción para ajustar los límites |
| `enforce` | Además bloquea por tiempo. Recomendado en producción |

Las revisiones de archivo rechazan en `monitor` y `enforce` (son precisas, no estadísticas); solo el bloqueo automático depende del modo.

## Panel
`GET /api/admin/security/threat-model` (admin con 2FA): modo y la lista de escudos y revisiones con su letra y las defensas que ya existen. Los eventos están en `GET /api/admin/audit?action=threat.` (detecciones y archivos) y `?action=access.denied`.

## Límites conocidos
- Los contadores viven en la memoria de cada servidor: con varios servidores cada uno cuenta aparte (el límite efectivo se multiplica). Para compartirlos, reemplaza `threat-ledger.service.ts` por uno con Redis, misma interfaz.
- Los escudos miran el código de estado HTTP. En GraphQL los errores suelen responder 200, así que solo cuentan los que corta un guard o el rate limit.
- Los umbrales son un punto de partida: ajústalos en cada archivo de `shields/` según el tráfico real (para eso existe `monitor`).
- Los bloqueos por IP afectan a todos los que comparten esa IP (oficinas, redes móviles). Por eso, con sesión se bloquea al usuario, no a la IP.
- No hay antivirus por decisión del proyecto: la defensa es no confiar en el archivo (ver `file-checks/README.md`).

**Estructura:** `controllers/` (`private/admin`), `contracts/resources/`, `services/`, `shields/`, `file-checks/` y `middleware/`. Cada carpeta nueva tiene su README.
