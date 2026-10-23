# admin-users
Gestión de usuarios para administradores (/api/admin/users, requiere rol ADMIN con 2FA).

- Listar/buscar usuarios con paginación.
- Suspender o reactivar una cuenta. Suspender cierra todas sus sesiones **y** crea un bloqueo de usuario (módulo `security`), de modo que el token que ya tenía deja de servir al instante; reactivar quita el bloqueo. Un admin no puede cambiar su propio estado.

Cada acción queda en la auditoría.
