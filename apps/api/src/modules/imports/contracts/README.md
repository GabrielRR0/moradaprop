# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| list-imports.dto.ts | paginación del historial (página y límite, máximo 50) |

| resource | Qué describe |
|---|---|
| import-job.resource.ts | una importación (con sus errores fila por fila), su resumen y la página del historial |

La subida de la planilla es un archivo (campo `file`), no un body: la valida el decorador `@UploadImportFile()`.

Esta carpeta no importa de controllers ni de services; solo al revés.
