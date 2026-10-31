# appointments
Citas de visita y apartados (leads).

El cliente solicita (VISITA con fecha futura, o RESERVA); quien gestiona la propiedad confirma o rechaza. Confirmar un apartado pasa la propiedad a RESERVADA (el primero gana); cancelarlo la libera. Se avisa por correo en ambos sentidos. El cliente ve su solicitud; el gestor ve además los datos de contacto. Evita duplicados y exceso de pendientes.

**Permisos:** cada acción pide la cita con `ownership.require` (`services/access/appointment.policy.ts`): `cancel` solo el cliente que la pidió; `respond` y `complete` solo quien gestiona la propiedad. Quien no cumple recibe 404 (no se confirma que el id existe) y el intento queda auditado como `access.denied`.

**Estructura:** `controllers/` (rutas por acceso: `private/user` y `private/publisher`), `contracts/` (`dto/` lo que entra, `resources/` lo que sale) y `services/` (fachada + `booking/`, `leads/`, `reader/` y `access/`). Cada carpeta tiene su README.
