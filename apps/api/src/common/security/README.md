# security (común)
Piezas de seguridad transversales:
- guards/: app-origin (solo nuestras apps, por Origin + clave) y roles (@Roles, @RequireTwoFactor). app-throttler.guard = rate limit.
- decorators/: @Public, @Roles, @CurrentUser, @RequestInfo, @Client...
- groups/: grupos de rutas: PublicGroup, GuestGroup, AuthGroup, TwoFactorGroup, RoleGroup, PublisherGroup, AgencyGroup, AdminGroup. Se edita solo ahí para cambiar el comportamiento de un grupo. La carpeta de cada controller debe coincidir con su grupo (lo comprueba tests/controller-layout.spec.ts).
- types/: un archivo por tipo (AuthUserContext, RequestContext, AppRequest, y los Payload de los tokens).
- tests/: la prueba de estructura de controllers.
- global-guards.module.ts: orden de la cadena (origen -> bloqueos -> throttle -> JWT -> roles).
- request-of.ts: obtiene la petición en REST o GraphQL; los contextos desconocidos se niegan.
