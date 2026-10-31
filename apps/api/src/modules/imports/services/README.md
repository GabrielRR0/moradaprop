# services
La lógica del módulo. Los controllers solo hablan con la fachada `imports.service.ts`.

```
services/
  imports.service.ts        fachada
  intake/                   recibir y procesar la planilla
    import-upload.service.ts       valida el archivo por contenido real, lo guarda en el bucket privado y lanza el proceso
    import-processor.service.ts    lee la hoja, valida fila por fila con las reglas de publicar e inserta por lotes
  history/
    import-query.service.ts        historial y detalle (un agente ve las suyas; el administrador, las de toda la agencia)
  templates/
    import-template.service.ts     plantillas descargables en .xlsx y .csv
```
