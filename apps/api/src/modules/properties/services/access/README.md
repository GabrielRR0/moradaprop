# access
Quién puede hacer qué con una propiedad.

| Archivo | Qué hace |
|---|---|
| property-policy.service.ts | `canManage` (admin de plataforma, dueño, admin de la agencia o agente asignado) y `managedFilter` (el filtro de "las que puedo gestionar"). Es el único service de este módulo que usan otros módulos (citas e importaciones), vía `index.ts` |
| property-access.policy.ts | regla de pertenencia para el `OwnershipService` de seguridad: busca la propiedad y responde 403 si no se puede gestionar |
