# appointments
Solicitudes de los interesados (leads) y su conversación: interés, pregunta, visita y apartado.

**Flujo.** El cliente le escribe al anunciante con un mensaje y elige qué quiere (`INTERES`, `PREGUNTA`, `VISITA` o `RESERVA`); **nunca elige la fecha**. Quien gestiona la propiedad ve el mensaje, responde (la solicitud pasa de `PENDIENTE` a `ABIERTA`) y, si es una visita, **propone de 1 a 5 fechas**; el cliente acepta una y queda registrada (`CONFIRMADA`, con `scheduledAt`). Quien gestiona puede cerrar la conversación y dejar la propiedad disponible, reservada con citas o reservada del todo (`acceptsVisits`).

**Editar mensajes.** Cada quien puede corregir sus propios mensajes de texto hasta **3 minutos** después de enviarlos (`PATCH /:id/messages/:messageId`). La regla la hace cumplir el servidor dentro de la misma consulta que guarda el cambio (no solo la pantalla); las propuestas de fechas y los avisos de acuerdo no se editan, ni tampoco una conversación cerrada. Un mensaje editado conserva su lugar en la bandeja, no avisa y queda con la marca "editado".

**Sin tiempo real.** Las respuestas suelen tardar: la conversación se lee cuando se abre y el aviso va por correo (sin el texto del mensaje). Cada conversación guarda hasta 200 mensajes.

**Apartado.** Confirmar un apartado (`PATCH /:id/respond`) pasa la propiedad a RESERVADA (el primero gana); cancelarlo la libera.

**Privacidad.** El texto de cada mensaje va cifrado y ligado a su fila (`AppointmentMessageVault`); el contacto y las notas también van cifrados. En claro quedan solo los datos que la base necesita para funcionar: quién escribió, la fecha y hora de cada mensaje, el tipo y estado de la solicitud y las fechas de visita (`scheduledAt` se consulta para avisar que la propiedad tiene una visita programada). El servidor descifra para mostrar la conversación, así que no es cifrado de extremo a extremo. El cliente no ve los datos internos; quien gestiona ve además el contacto. La ficha pública solo dice que la propiedad **tiene una visita programada**, nunca el día.

**Permisos:** cada acción pide la cita con `ownership.require` (`services/access/appointment.policy.ts`): `cancel` y `accept` solo el cliente que la pidió; `view` y `write` el cliente o quien gestiona (la conversación); `respond`, `complete`, `propose` y `close` solo quien gestiona la propiedad. Quien no cumple recibe 404 (no se confirma que el id existe) y el intento queda auditado como `access.denied`.

**Estructura:** `controllers/` (rutas por acceso: `private/user` y `private/publisher`), `contracts/` (`dto/` lo que entra, `resources/` lo que sale) y `services/` (fachada + `booking/`, `leads/`, `thread/`, `notify/`, `reader/` y `access/`). Cada carpeta tiene su README.
