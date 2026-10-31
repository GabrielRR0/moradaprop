# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| create-appointment.dto.ts | pedir una visita (con fecha futura) o un apartado |
| respond-appointment.dto.ts | confirmar o rechazar, con una nota opcional |
| list-appointments.dto.ts | filtros y paginación de "mis solicitudes" y "recibidas" |

| resource | Qué describe |
|---|---|
| appointment-client.resource.ts | la solicitud como la ve el cliente, y su página |
| appointment-lead.resource.ts | la misma más los datos de contacto, como la ve quien gestiona, y su página |

Esta carpeta no importa de controllers ni de services; solo al revés.
