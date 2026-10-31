# services
Pocos archivos, por eso quedan planos (sin carpetas por tema).

| Archivo | Qué hace |
|---|---|
| agencies.service.ts | fachada: el controller solo habla con ella |
| agency-profile.service.ts | ver la agencia con su equipo y plan, y editar su perfil |
| agency-members.service.ts | invitar agentes (token de un solo uso), aceptar la invitación y quitar agentes |
| agency-access.service.ts | pertenencia: de aquí salen los permisos (`requireMember`, `requireAdmin`) |

Si el módulo crece más allá de 4 archivos, se agrupan en carpetas por tema (ver `docs/CONVENCIONES.md`).
