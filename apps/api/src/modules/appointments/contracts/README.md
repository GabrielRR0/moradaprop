# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| create-appointment.dto.ts | escribirle al anunciante: tipo (interés, pregunta, visita, apartado) y mensaje; la fecha ya no se pide |
| send-message.dto.ts | un mensaje de la conversación |
| propose-slots.dto.ts | las fechas (1 a 5) que ofrece quien gestiona, con una nota opcional |
| respond-appointment.dto.ts | confirmar o rechazar, con una nota opcional |
| list-appointments.dto.ts | filtros y paginación de "mis solicitudes" y "recibidas" |

| resource | Qué describe |
|---|---|
| appointment-client.resource.ts | la solicitud como la ve el cliente, y su página |
| appointment-lead.resource.ts | la misma más los datos de contacto, como la ve quien gestiona, y su página |
| appointment-thread.resource.ts | la conversación completa: mensajes, fechas propuestas y quién la mira (`viewer`) |

Esta carpeta no importa de controllers ni de services; solo al revés.
