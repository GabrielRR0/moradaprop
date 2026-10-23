# users
Perfil propio del usuario autenticado.

- GET/PATCH /api/users/me: ver y editar nombre/teléfono.
- POST /api/users/me/password: cambiar contraseña (cierra las demás sesiones).
- POST /api/users/me/become-owner: sumar el rol OWNER.

El id del usuario sale siempre del token, nunca de la URL ni del body. Services: profile, change-password, fachada users.service.
