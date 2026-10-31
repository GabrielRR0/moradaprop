# services
Pocos archivos, por eso quedan planos.

| Archivo | Qué hace |
|---|---|
| threat-model.service.ts | fachada: describir el modelo, reportar hechos y revisar archivos |
| threat-ledger.service.ts | libro de hechos con ventana deslizante: cuántas veces pasó algo en los últimos N segundos (vive en la memoria de cada servidor) |
| threat-response.service.ts | lo que se hace al detectar algo: dejar constancia en la auditoría y, en `enforce`, bloquear por tiempo |
