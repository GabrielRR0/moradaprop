# security
Bloqueos de acceso y su panel admin (/api/admin/security).

**Tipos de bloqueo:** IP, rango CIDR, país, usuario, correo y dominio de correo; con vencimiento opcional.
**Piezas:** block-check.service (decide, con caché de 30 s), block-rule.service (CRUD con validación por tipo), guards/block.guard (guard global que corta antes de llegar a cualquier ruta), utils/cidr.ts.
El país se lee de cabeceras de CDN (cf-ipcountry, etc.). Funciona igual en REST y GraphQL.
