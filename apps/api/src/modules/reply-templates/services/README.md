# services
La lógica del módulo. El controller solo habla con la fachada `reply-templates.service.ts`.

```
services/
  reply-templates.service.ts     fachada
  catalog/
    reply-template-catalog.service.ts    listar los textos (propios y del equipo) ya descifrados
  management/
    reply-template-write.service.ts      guardar, editar, compartir y borrar (cifra antes de guardar, aplica los límites y audita)
  access/
    reply-template.policy.ts             quién puede editar o borrar, y a qué inmobiliaria pertenece cada usuario
```

El `id` de cada texto se genera antes de guardar (`randomUUID()`) porque el cifrado queda ligado a su fila.
