# lib

Utilidades compartidas de la web (no pertenecen a un módulo).

| Archivo       | Para qué sirve                                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dc.ts`       | `css("a:b; c:d")` convierte un string CSS en objeto `style` (lo usan los estilos del diseño con valores calculados) y el tipo `Vals` (lo que devuelve el hook de cada pantalla).                                        |
| `theme.tsx`   | `ThemeProvider` / `useTheme()`: modo noche y color de marca (`--ac`). Guarda la elección en `localStorage` (`theme`, `accent`). `ACCENTS` lista los colores en estudio y `themeInitScript` evita el parpadeo al cargar. |
| `toast.ts`    | `toast("texto", "ok" \| "info" \| "warn")`: avisos breves desde cualquier hook. Los dibuja `components/Toaster`.                                                                                                        |
| `login-prompt.ts` | `askLogin("guardar tus favoritos")`: abre el aviso "ingresa para continuar" con un botón al login (vuelve a la página actual). Lo dibuja `components/LoginPrompt`. |
| `whatsapp.ts` | `whatsappUrl(mensaje?, telefono?)`: enlace `wa.me` con mensaje listo. Número de ejemplo en `NEXT_PUBLIC_WHATSAPP_NUMBER`.                                                                                               |

El color de marca y los neutros viven como variables CSS en `app/globals.css`; `theme.tsx` solo cambia `--ac` y `data-theme`.

**Seguridad:** `api.ts` es el cliente HTTP único del API (cabeceras `x-app-*`, access token solo en memoria, **un solo refresh a la vez**, un reintento, aviso `SECOND_FACTOR_ENROLLMENT_REQUIRED`; `ApiError` trae `status` y `code`). `api-types.ts` tiene los tipos de las respuestas de seguridad y `password.ts` los requisitos de contraseña que valida el API.

**Mensajes:** `appointments/` tiene los tipos, `appointmentService` (todas las llamadas de `/api/appointments`) y los textos y fechas en español de las solicitudes y su conversación. Lo usan la ficha (donde se escribe) y `inbox` (donde se conversa).

**Respuestas guardadas:** `reply-templates/` tiene los tipos, `replyTemplateService` y `fillTemplate` (completa `{nombre}` y `{propiedad}` al usar un texto). Lo usa `inbox`.

**Propiedades:** `properties/` es el servicio compartido de propiedades: `propertyService` (búsqueda, mapa y ficha desde el API, con datos de ejemplo opcionales), filtros <-> URL, tipos, `format` (precios, textos) y `useFavorites` (favoritos reales de la cuenta). Lo usan mapa, inicio y ficha.
