# security (común)
Piezas de seguridad transversales:
- guards/: app-origin (solo nuestras apps, por Origin + clave) y roles (@Roles, @RequireTwoFactor). app-throttler.guard = rate limit.
- decorators/: @Public, @Roles, @CurrentUser, @RequestInfo, @Client...
- groups/: grupos de rutas: PublicGroup, GuestGroup, AuthGroup, RoleGroup, AdminGroup. Se edita solo ahí para cambiar el comportamiento de un grupo.
- global-guards.module.ts: orden de la cadena (origen -> bloqueos -> throttle -> JWT -> roles).
- request-of.ts: obtiene la petición en REST o GraphQL; los contextos desconocidos se niegan.
