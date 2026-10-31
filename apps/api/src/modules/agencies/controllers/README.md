# controllers
Las rutas HTTP del módulo, separadas por quién puede usarlas. El decorador de acceso va en la clase y la carpeta coincide con él.

```
controllers/
  private/
    user/                    cualquier usuario con sesión   @AuthGroup()
      agency-invitations.controller.ts    POST /api/agencies/invitations/accept
    agency/                  cuentas con rol AGENCY         @AgencyGroup()
      my-agency.controller.ts             GET y PATCH /api/agencies/me
      agency-members.controller.ts        POST /api/agencies/me/members/invite · DELETE /api/agencies/me/members/:memberId
```

No hay `public/`: todas las rutas de agencias piden sesión.

## Reglas
- La agencia sale siempre de la cuenta del token: ninguna ruta recibe un `agencyId`.
- `AgencyGroup` solo exige el rol; que sea el **administrador** de la agencia (para editar, invitar o quitar) lo valida `AgencyAccessService.requireAdmin` en el service.
- Controller delgado: recibe, llama a `AgenciesService` y devuelve su `Resource`.
