# contracts
El contrato del módulo con el exterior: **todo lo que entra y todo lo que sale**, y nada más. Si quieres saber qué manda y qué recibe el frontend, solo abres esta carpeta.

```
contracts/
  dto/         lo que ENTRA   (valida el body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

## Reglas
1. Aquí solo hay formas de datos: clases con validadores en `dto/`, interfaces en `resources/`. Sin lógica de negocio ni consultas.
2. Un archivo por caso. Si algo se usa solo en una ruta, igual lleva su archivo propio.
3. Los controllers, services y el mapper importan de aquí; esta carpeta no importa de ellos.
4. Lo que otros módulos necesiten de aquí se exporta desde el `index.ts` del módulo, nunca importando la ruta interna.

Cada subcarpeta tiene su propio README con el detalle.
