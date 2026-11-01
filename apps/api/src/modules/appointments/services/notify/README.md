# notify
Avisos por correo de las novedades de una conversación.

`appointment-notifier.service.ts` tiene dos métodos: `toClient` (al cliente que pidió la cita) y `toManagers` (al dueño y al agente asignado de la propiedad). El evento puede ser `message`, `proposal` (fechas propuestas) o `accepted` (fecha aceptada).

El correo **no lleva el texto del mensaje**, solo un enlace a `/mensajes/:id`: lo escrito se queda dentro de la plataforma, donde está cifrado. Los fallos de envío no rompen la petición (`MailSupport.Service` los registra y sigue).
