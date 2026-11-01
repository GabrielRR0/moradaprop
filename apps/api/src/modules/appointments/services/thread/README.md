# thread
La conversación de una solicitud: la usan los dos lados (el cliente y quien gestiona la propiedad).

| Archivo | Qué hace |
|---|---|
| `appointment-thread-reader.service.ts` | `open`: pide la cita con `view`, la marca como vista por quien la abre (apaga el aviso de "nuevo") y la arma ya descifrada. `build`: la misma conversación sin marcar nada (la usan los servicios de escritura al terminar). |
| `appointment-conversation.service.ts` | `send` (mensaje de texto), `edit` (corregir un mensaje propio, hasta 3 minutos), `propose` (fechas de visita) y `accept` (el cliente elige una). |

**Reglas**
- Solo se escribe mientras la solicitud está abierta (`PENDIENTE`, `ABIERTA` o `CONFIRMADA`) y hasta 200 mensajes.
- Cuando quien gestiona responde por primera vez, la solicitud pasa de `PENDIENTE` a `ABIERTA`.
- Editar: solo el autor, solo mensajes de texto y solo mientras la conversación está abierta. La ventana de 3 minutos (`EDIT_WINDOW_MS`) va en la propia actualización (`updateMany` con `createdAt` reciente): si ya pasó, no cambia nada y responde 400. Si se edita el primer mensaje del cliente, también se actualiza el campo `message` de la solicitud. La respuesta trae `editableUntil` por mensaje y `serverTime`, para que la pantalla cuente el tiempo con el reloj del servidor.
- Proponer fechas descarta las que seguían sin aceptarse: solo hay una propuesta viva. Cada fecha debe ser futura y estar dentro de los próximos 90 días. Ofrecer fechas convierte un interés o una pregunta en una visita.
- Aceptar una fecha es atómico: la primera petición gana, las demás fechas se descartan, la cita pasa a `CONFIRMADA` con su `scheduledAt` y queda un mensaje de acuerdo.
- Cada escritura sube la conversación en la bandeja (`lastMessageAt`), la deja vista por quien escribió y avisa por correo a la otra parte (`notify/`).
