# Sistema modular del backend (plantilla para cualquier backend nuevo)

Esta es la forma de trabajar del backend de este proyecto, escrita para poder **repetirla tal cual** en otro proyecto. Todo lo que aquí se describe existe y está verificado en `apps/api`: el módulo `apps/api/src/modules/properties` es la **referencia viva** (cada carpeta tiene su README). Las reglas detalladas están en [CONVENCIONES.md](CONVENCIONES.md); este documento explica el sistema completo y cómo montarlo.

## La idea en una frase

> Cada cosa vive en un solo lugar y su carpeta dice lo que es: **quién puede usar la ruta** (controllers), **qué entra y qué sale** (contracts), **qué hace** (services). Lo que se puede comprobar con código, se comprueba con código.

## Qué lo hace especial

| Pieza | Qué resuelve |
|---|---|
| Controllers separados por acceso | Abres `controllers/public/` y ves todo lo expuesto sin sesión. El acceso va en la clase, una sola vez. |
| `contracts/dto` y `contracts/resources` | Un solo lugar dice qué entra y qué sale. Los Resources son interfaces simples, y **las pruebas verifican que la respuesta real los cumple**. |
| Services por tema, con fachada | Un archivo por caso de uso, agrupados por tema; los controllers solo hablan con la fachada. |
| Grupos de acceso con nombre | `@PublisherGroup()` en vez de listar roles en cada ruta; se cambia el comportamiento de un grupo editando un solo archivo. |
| Alias `@/` | Sin `../../../..`; lo hace cumplir el lint. |
| README por carpeta | Se entiende qué hay y para qué sirve sin abrir el código. |

## Estructura de la API

```
apps/api/src/
  main.ts · app.module.ts
  bootstrap/        configuración común de la app (la usan main y los tests e2e)
  config/           única capa que lee variables de entorno
  common/           infraestructura transversal (security, prisma, storage, crypto, files...)
  support/          envoltorios de paquetes de terceros (nadie importa el paquete directo)
  routes/           un archivo de rutas por módulo, agrupadas bajo /api
  modules/<modulo>/ la lógica de negocio, un módulo por carpeta
apps/api/test/      e2e (Supertest) y ayudas de prueba
```

## Estructura de un módulo

```
<modulo>/
  <modulo>.module.ts          registra todo (el orden de controllers importa: ver abajo)
  index.ts                    lo único que otros módulos pueden importar
  controllers/                las rutas, separadas por quién puede usarlas
    public/                     sin sesión                      @PublicGroup() / @GuestGroup()
    private/
      user/                     cualquier usuario autenticado   @AuthGroup()
      publisher/                quienes publican                @PublisherGroup()
      admin/                    solo administradores            @AdminGroup()
      <rol>/                    cualquier otro grupo por rol    @<Rol>Group()
  contracts/
    dto/                        lo que ENTRA (class-validator)
    resources/                  lo que SALE (una interface por respuesta)
  services/
    <modulo>.service.ts         fachada
    <tema>/                     una carpeta por tema (catalog, management, images, access...)
      <modulo>-<caso>.service.ts  un archivo por caso de uso
  decorators/                 decoradores compuestos (solo si algo se repite 3+ veces)
  utils/                      funciones puras compartidas
  tests/                      pruebas unitarias del módulo
  README.md                   y uno por cada carpeta
```

Las carpetas aparecen **solo si existen**: un módulo sin rutas de admin no tiene `admin/`, y uno con 4 services o menos los deja planos.

## Las reglas

1. **Un controller = un acceso + un recurso.** El decorador de grupo va en la clase; la carpeta debe coincidir con él. Una excepción de rol en una ruta se pone en el método y lleva un comentario que diga por qué.
2. **Controller delgado.** Recibe, llama a la fachada y devuelve. Cero lógica. Su tipo de retorno es el Resource (`Promise<ProductListResource>`).
3. **Validación solo en DTO.** Los DTO nunca aceptan `userId`, `role` ni campos internos: el usuario sale del token.
4. **Resources simples.** Interfaces con comentarios, sin tipos rebuscados. Un archivo por respuesta; si dos comparten campos, una `extends` la otra.
5. **Services por tema y caso de uso.** Lecturas (sin efectos, cacheables) separadas de escrituras (auditan, usan transacciones). No se separa por verbo (crear/editar/borrar). Más de ~150 líneas, se divide.
6. **La fachada se queda.** Aunque un service se divida, la fachada mantiene la misma API pública; los demás módulos no se enteran.
7. **De otro módulo solo se importa su `index.ts`.** Un archivo no pasa de 600 líneas.
8. **Imports:** `@/` = `src/` y `@test/` = `test/`. Lo cercano (`./`, `../`) va relativo; lo que sale del módulo o sube 3+ niveles va con alias.
9. **Nombres:** el sufijo dice el papel: `Dto` (entra), `Resource` (sale), `Context` (datos de la petición), `Payload` (contenido de un token), `Service` / `Policy` / `Vault` (clases con lógica). Un archivo por tipo, con el papel en el nombre.
10. **README en cada carpeta nueva.**

### El orden de controllers importa

Las rutas fijas (`mine`, `map`, `template.xlsx`) deben registrarse **antes** que `GET :id`. En el `controllers: [...]` del módulo, el controller que tiene `GET :id` va **último**, y se deja comentado.

## Qué hace cumplir el código (no depende de acordarse)

| Regla | Quién la impone |
|---|---|
| Sin imports de 3+ niveles | ESLint (`DEEP_RELATIVE_IMPORTS` en `eslint.config.mjs`) |
| De otro módulo solo su `index.ts` | ESLint (`eslint-rules/module-boundaries.mjs`) |
| Paquetes de terceros solo vía `support/` | ESLint (`no-restricted-imports`) |
| Máximo 600 líneas y sin `process.env` fuera de `config/` | ESLint |
| La carpeta del controller coincide con su grupo de acceso | `src/common/security/tests/controller-layout.spec.ts` |
| **La respuesta real cumple el Resource que declara la ruta** | `test/support/resource-contract.ts` (en todos los e2e) |

El validador de contrato lee el tipo de retorno de cada ruta y compara la respuesta real: campos obligatorios presentes y del tipo correcto, y **ningún campo que el Resource no declare** (así se detecta una fuga de datos internos). Detalle en [apps/api/test/README.md](../apps/api/test/README.md).

## Montar un backend nuevo con este sistema

Copia estas piezas tal cual (ajustando nombres propios como `AppConfig` o `DbSupport`) y trabaja con ellas desde el primer día:

**Configuración**
- `tsconfig.json` con `paths`: `"@/*": ["src/*"]` y `"@test/*": ["test/*"]` (y `baseUrl: "./"`).
- `jest.config.js` y `jest.e2e.config.js` con `moduleNameMapper` para los dos alias.
- `package.json`: dependencia de desarrollo `tsconfig-paths` y los scripts de `ts-node` con `-r tsconfig-paths/register`. (`nest build` y `nest start` reescriben los alias solos.)
- `eslint.config.mjs` y `eslint-rules/module-boundaries.mjs`.

**Código transversal**
- `src/common/security/`: `groups/` (los grupos de acceso con nombre), `decorators/`, `guards/`, `types/` (un archivo por tipo), `rate-limits.ts`, `request-of.ts`, `global-guards.module.ts`.
- `src/support/`: el patrón de envoltorios de terceros.
- `src/routes/`: el árbol de rutas por módulo.
- `src/config/` y `src/bootstrap/configure-app.ts`.

**Pruebas**
- `test/support/`: `describe-case.ts`, `test-app.ts` (registra el validador de contrato), `resource-contract.ts`, y el reporter en español.
- `src/common/security/tests/controller-layout.spec.ts`.

**Documentación**
- `docs/CONVENCIONES.md` y este documento. Cada módulo nuevo lleva sus README.

### Orden recomendado
1. Crea el repositorio, copia la configuración y comprueba que `tsc`, el lint y una prueba vacía corren.
2. Copia el código transversal y adapta `config/` y `support/db` a tu base de datos.
3. Crea el primer módulo siguiendo la lista de abajo, usando `modules/properties` como guía.
4. Escribe su e2e: el validador de contrato ya comprueba sus respuestas.
5. Repite por módulo. Antes de cerrar cada uno, corre la lista de verificación.

## Crear un módulo nuevo (lista)

1. Lista las rutas y **quién puede usar cada una**; eso decide las carpetas de `controllers/`.
2. `contracts/dto/` con un DTO por caso y `contracts/resources/` con una interface por respuesta.
3. `services/` con la fachada y, si hay más de 4 archivos, carpetas por tema.
4. Controllers con el grupo en la clase y el Resource como tipo de retorno.
5. Registra el módulo (`<modulo>.module.ts`, `index.ts`, `routes/<modulo>.routes.ts`).
6. README en cada carpeta nueva.
7. Verifica: `tsc`, lint, pruebas unitarias y e2e.

### Ejemplo mínimo

```ts
// contracts/dto/list-widgets.dto.ts          (entra)
export class ListWidgetsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
}

// contracts/resources/widget-list.resource.ts (sale)
export interface WidgetListResource {
  items: Array<{ id: string; name: string }>;
  total: number;
}

// controllers/private/user/widgets.controller.ts
@AuthGroup()
@ApiTags('widgets')
@Controller()
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Get()
  list(@Query() query: ListWidgetsDto, @CurrentUser() user: AuthUserContext): Promise<WidgetListResource> {
    return this.widgetsService.list(user, query);
  }
}
```

## Cómo verificar sin sobrecargar la máquina

- Los tipos se revisan aparte con `tsc --noEmit`; Jest puede correr sin chequeo de tipos (`ts-jest` con `isolatedModules`) y con un solo proceso.
- Los e2e solo necesitan la base de datos y Redis, no el API ni la web.
- Una suite completa de e2e cabe en un solo proceso de Node con un límite de 1 GB (`--max-old-space-size=1024`).

## Por qué está así

- **Acceso por carpeta:** la primera pregunta de cualquier ruta es "¿pide sesión?". Revisar qué está expuesto es abrir una carpeta.
- **`contracts/` aparte:** quien consume el API solo necesita ver esa carpeta.
- **Services por tema y no por verbo:** crear, editar y borrar comparten permisos, auditoría y caché; separarlos los repite.
- **Fachada estable:** permite partir un service grande sin tocar a quienes lo usan.
- **Reglas con código:** una convención que depende de la memoria se pierde; una que rompe el lint o una prueba, no.

## Límites conocidos

- Los DTO que se heredan entre sí (por ejemplo un código de verificación que extiende un correo) se mantienen agrupados por tema en un solo archivo.
- El validador de contrato solo ve las rutas que alguna prueba e2e ejecuta; una ruta nueva sin prueba no queda comprobada.
- Las opciones de WebAuthn (passkeys) se tipan a mano porque las consume el navegador y no hay un tipo propio del proyecto que las describa.
