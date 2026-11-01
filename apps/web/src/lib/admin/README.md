# admin

Lo que usa la administración de la web para hablar con la API.

| Archivo | Para qué sirve |
| --- | --- |
| `settings-service.ts` | `adminSettingsService`: listar, guardar y quitar los ajustes de la plataforma (correo con Resend) y mandar el correo de prueba. Las rutas cuelgan del prefijo de admin (`NEXT_PUBLIC_ADMIN_API_PREFIX`). |
| `recent-factor.ts` | `withRecentSecondFactor(accion, confirmar)`: ejecuta una acción sensible y, si la API pide confirmar el segundo factor (`403 RECENT_TWO_FACTOR_REQUIRED`), abre el panel "Confirma que eres tú" y repite la acción **una vez**. Si el admin cancela, la acción no se repite. |

Los usa `modules/admin` (pantalla `/admin/ajustes`). El panel de confirmación vive en `modules/auth` (`ConfirmIdentitySheet`).
