# services
Pocos archivos, por eso quedan planos.

| Archivo | Qué hace |
|---|---|
| security.service.ts | fachada: lo que otros módulos pueden usar (¿está bloqueado?, bloquear un usuario...) |
| block-check.service.ts | decide si una petición está bloqueada; las reglas se cachean 30 segundos |
| block-rule.service.ts | crear, listar y quitar reglas (lo usa el panel admin), y bloquear o desbloquear a un usuario |
