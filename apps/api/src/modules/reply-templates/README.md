# reply-templates
Textos reutilizables ("borradores") para responder mensajes con un toque.

Cada texto es **privado** (solo su autor) o **compartido** con todo el equipo de su inmobiliaria. Para compartir hay que pertenecer a una inmobiliaria (invitación aceptada); quien no pertenece a ninguna solo tiene privados.

**Cifrado.** El título y el texto van cifrados y **ligados a su fila** (`ReplyTemplateVault`): ni un dump de la base ni quien tenga acceso de escritura puede leerlos o moverlos de una fila a otra. Como la base no puede buscar en texto cifrado, la lista se devuelve entera (hasta 300) y la búsqueda se hace en el cliente. La auditoría registra quién y qué pasó, nunca el contenido.

**Permisos** (`services/access/reply-template.policy.ts`): editar y borrar lo hace su autor, o el administrador de la inmobiliaria si está compartido. Los privados de otra persona no se confirman ni a un administrador: responden 404. Los administradores de plataforma no ven textos ajenos.

**Límites:** 50 privados por persona y 100 compartidos por inmobiliaria; título hasta 80 y texto hasta 1000 caracteres (lo mismo que un mensaje).

**Estructura:** `controllers/` (`private/publisher`), `contracts/` (`dto/` y `resources/`), `services/` (fachada + `catalog/`, `management/` y `access/`) y `utils/`. Cada carpeta tiene su README.
