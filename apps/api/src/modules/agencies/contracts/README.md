# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| invite-agent.dto.ts | invitar a un agente por correo |
| accept-invitation.dto.ts | aceptar la invitación con el token del enlace |
| update-agency.dto.ts | editar el perfil (el plan no se puede editar aquí) |

| resource | Qué describe |
|---|---|
| agency.resource.ts | datos de la agencia y el uso de su plan |
| agency-member.resource.ts | un miembro del equipo |
| my-agency.resource.ts | la agencia del usuario con su equipo y su plan |
| invitation.resource.ts | respuestas de invitar y de aceptar |

Esta carpeta no importa de controllers ni de services; solo al revés.
