# diseno-a-react

> **RETIRADO.** Este conversor sirvió una sola vez para pasar el diseño a React. Desde entonces las pantallas de
> `apps/web` se **mantienen a mano** (se unificaron iconos, barra lateral y partes con nombre, y el módulo `map` se
> reescribió con el mapa real). Volver a correrlo sobrescribiría ese trabajo, por eso pide `--force`.
> Se conserva como referencia de cómo se hizo la conversión.

Herramienta de **arranque** que convirtió el diseño (`docs/diseno/pantallas/*.dc.html`) en el frontend de
React (`apps/web/src/modules/*`). El resultado se ve igual que el diseño porque el JSX conserva sus
estilos y su lógica; lo que cambia es que ahora son componentes, hooks y rutas reales de Next.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `convert.mjs` | Programa principal: recorre las pantallas, escribe componentes, hooks, CSS, páginas por módulo, `index.ts` y README de cada módulo. |
| `template.mjs` | Convierte el marcado del diseño (`<x-dc>`, `{{huecos}}`, `sc-for`, `sc-if`) a JSX. Parte las pantallas largas en `SectionN.tsx`. |
| `css.mjs` | Acota el CSS de cada pantalla bajo `.ds-<pantalla>` y renombra los `@keyframes`. |
| `logic.mjs` | Convierte la clase `Component extends DCLogic` en un hook (`use<Pantalla>`). |
| `enhance.mjs` | Mejoras sobre la maqueta: avisos (toast), redirecciones y acciones que el diseño solo dibujaba. |
| `screens.mjs` | Catálogo: pantalla → componente, módulo, ruta, ajuste de tamaño y páginas. **Aquí se agrega una pantalla nueva.** |
| `routes.mjs` | Genera `apps/web/src/app/<ruta>/page.tsx`. |

## Cómo se usa

```bash
node scripts/diseno-a-react/convert.mjs   # regenera módulos
node scripts/diseno-a-react/routes.mjs    # regenera app/<ruta>/page.tsx
pnpm format                               # prettier sobre lo generado
pnpm lint && pnpm --filter @app/web build
```

## Qué hace con cada pantalla

1. Lee `docs/diseno/pantallas/<X>.dc.html`.
2. El CSS de `<helmet>` se acota a `.ds-<pantalla>` y los keyframes se renombran.
3. El marcado pasa a JSX: estilos inline como objetos, `class`→`className`, `href="X.dc.html"`→ ruta real
   (`next/link`), `[NOMBRE]`→`brand.name`, botones sin `type` reciben `type="button"`.
4. Las pantallas de tamaño fijo (1440×960, 390×844) pasan a ocupar la ventana (`100dvh`); las móviles
   se centran con ancho máximo.
5. La lógica pasa a un hook; el tema (modo noche y color de marca) ya no se calcula ahí: sale de
   `globals.css` y `ThemeProvider`.
6. `enhance.mjs` agrega avisos y acciones (si un parche no encuentra su texto, el conversor falla a propósito).

## Regla importante

**Es una herramienta de arranque.** En cuanto alguien edite a mano un archivo generado (por ejemplo para
conectar el API), no debe volver a correr el conversor sobre ese archivo: lo sobrescribiría. Los cambios
visuales nuevos se hacen en el diseño y se vuelven a convertir **solo** si esa pantalla no fue editada a mano;
si ya fue editada, se aplican a mano.
