# controllers
Las rutas HTTP del módulo. Primero se separa por **¿pide sesión?** y luego por **qué puede hacer quien entra**.

```
controllers/
  public/                  sin sesión            @PublicGroup()
    properties.controller.ts            buscar, mapa, rent-stats, ficha
  private/                 requiere sesión
    user/                  cualquier usuario     @AuthGroup()
      property-favorites.controller.ts  mis favoritos
    publisher/             OWNER, AGENCY, ADMIN  @PublisherGroup()
      my-properties.controller.ts       mine, crear, editar, estado, agente, borrar
      property-images.controller.ts     subir, borrar, portada
```

## Reglas
1. **Un controller = un acceso + un recurso.** El decorador de acceso va en la clase, una sola vez.
2. **El nombre de la carpeta coincide con el decorador** (`public/` → `@PublicGroup()`). Si no coinciden, algo está mal.
3. **Excepciones por ruta**: el método pone su propio grupo y sobrescribe al de la clase (`create` excluye ADMIN, `assignAgent` solo AGENCY y ADMIN).
4. **Controller delgado**: recibe, llama a un service y devuelve. La validación vive en `contracts/dto/`, la forma de la respuesta en `contracts/resources/` y la lógica en `services/`.
5. **Carpetas solo si existen**: no se crea `admin/` mientras no haya rutas exclusivas de admin.

## Orden de registro
Todos comparten el prefijo `/api/properties` (lo pone `routes/properties.routes.ts`). Como `GET /:id` del controller público captura cualquier texto, en `properties.module.ts` va **al final** de la lista de controllers; así `mine` y `favorites` se resuelven antes.

## Agregar una ruta
1. ¿Quién puede usarla? Eso decide la carpeta.
2. ¿Es del mismo recurso que un controller de esa carpeta? Agrégala ahí. Si no, crea un controller nuevo.
3. Si necesita otro acceso, va a otra carpeta, no se mezcla.
