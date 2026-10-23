# auth
Registro, verificación de correo, login, sesiones, recuperación de contraseña, 2FA y Google.

**Estructura:** auth.controller.ts (delgado) -> services/auth.service.ts (fachada) -> services hijos: register, verify-email, login, token (JWT + refresh rotativo), two-factor (TOTP, códigos de respaldo, correo), password-reset, google-auth, verification-code. guards/jwt-auth.guard.ts es el guard global de token. dto/ valida cada entrada.

**Cómo funciona:** el access token (JWT corto) viaja en el header; el refresh token es de un solo uso y rota en cada /refresh (web: cookie httpOnly; móvil: body). Reusar un refresh viejo cierra todas las sesiones. Los códigos de 6 dígitos se guardan hasheados, con intentos y cooldown. Las respuestas no revelan si un correo existe.

**Rutas:** /api/auth/*. **Tests:** test/e2e/auth-*.e2e-spec.ts.
