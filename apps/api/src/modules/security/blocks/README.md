# blocks
Mini módulo de `security`: bloqueos de acceso y su panel admin (`/api/admin/security`).

**Tipos de bloqueo:** IP, rango CIDR, país, usuario, correo y dominio de correo; con vencimiento opcional.
**Piezas:** `services/block-check.service` (decide, con caché de 30 s), `services/block-rule.service` (CRUD con validación por tipo y `blockTemporarily` para bloqueos con vencimiento), `services/security.service` (fachada que usan los demás módulos), `guards/block.guard` (guard global que corta antes de llegar a cualquier ruta), `utils/cidr.ts`, `blocks.controller` (panel admin).
El país se lee de cabeceras de CDN (cf-ipcountry, etc.). Funciona igual en REST y GraphQL.

Quien crea bloqueos automáticos es `threat-model` (con `createdBy = 'threat-model'` y vencimiento). Los que crea un admin a mano no vencen salvo que se indique, y un bloqueo permanente nunca se acorta solo.
