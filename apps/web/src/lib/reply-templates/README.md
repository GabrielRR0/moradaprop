# reply-templates

Textos reutilizables para responder mensajes (borradores): privados de quien los escribe o compartidos con el equipo de la inmobiliaria. Se guardan **cifrados** en el servidor (título y texto).

| Archivo | Para qué sirve |
| --- | --- |
| `types.ts` | Forma de las respuestas de `/api/reply-templates`. |
| `reply-template-service.ts` | `replyTemplateService`: listar, crear, editar y borrar. |
| `fill.ts` | `fillTemplate`: cambia `{nombre}` y `{propiedad}` por los datos de la conversación al usar un texto, y `VARIABLES` (los botones para insertarlas). |

Los usa `modules/inbox`: el selector dentro de la conversación y la pantalla `/mensajes/respuestas`.
