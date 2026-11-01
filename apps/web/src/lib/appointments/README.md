# appointments

Lo que comparten la ficha de la propiedad (donde el cliente escribe) y la bandeja de mensajes (donde se conversa): tipos, llamadas al API y textos.

| Archivo | Para qué sirve |
| --- | --- |
| `types.ts` | Forma de las respuestas de `/api/appointments` (solicitud, conversación, mensaje y fechas propuestas). |
| `appointment-service.ts` | `appointmentService`: crear la solicitud, leer la bandeja y la conversación, escribir, proponer y aceptar fechas, cancelar, cerrar y dejar la propiedad disponible o reservada. |
| `format.ts` | Etiquetas de tipo y estado, fechas en español (`formatSlot`, `timeAgo`), la cuenta regresiva de la edición (`msLeft`, `formatCountdown`) y los mensajes de ejemplo para empezar rápido. |

**Cómo funciona el flujo**
1. El cliente elige qué quiere (Estoy interesado, Tengo una pregunta o Pedir una visita) y escribe un mensaje. Nunca elige la fecha.
2. Quien gestiona la propiedad ve el mensaje en su bandeja, responde, y si es una visita **propone de 1 a 5 fechas**.
3. El cliente acepta una; queda registrada y la propiedad muestra "Tiene una visita programada" (sin decir el día).
4. Quien gestiona puede dejar la propiedad **disponible**, **reservada pero con citas** o **reservada del todo**.

**No es en tiempo real.** Las respuestas suelen tardar, así que la conversación solo se actualiza al abrirla o con el botón "Recargar"; por correo se avisa cuando hay novedades.
