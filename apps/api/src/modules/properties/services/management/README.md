# management
Lo que hacen quienes publican (propietarios, agencias y admin) sobre sus propias propiedades.

| Archivo | Qué hace |
|---|---|
| property-write.service.ts | crear, editar, cambiar estado (transiciones validadas), asignar agente y borrar; audita cada cambio |
| property-mine.service.ts | "mis propiedades": las que el usuario gestiona, en cualquier estado |

El dueño, la agencia y el agente salen siempre del token, nunca del body. Quién puede gestionar qué lo decide `../access/`.
