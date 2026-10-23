# icons

Iconos de la interfaz como un solo componente: `<Icon name="home" size={20} />`.

| Archivo     | Para qué sirve                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Icon.tsx`  | Dibuja el `<svg>` (24×24, trazo `currentColor`, extremos redondos). Props: `name` o `d`, `size`, `strokeWidth`, `fill`, `style`. |
| `paths.tsx` | Catálogo: un nombre → su dibujo. Para un icono nuevo, agrega una entrada aquí y el nombre aparece en el autocompletado.          |
| `index.ts`  | Archivo padre: `import { Icon } from '@/components/icons'`.                                                                      |

- El icono toma el color del texto (`color` del padre), por eso en modo noche o en botones de color cambia solo.
- Si el dibujo viene en los datos (ej. los servicios de la propiedad) se usa `<Icon d={ruta} />`.
- Quedan como `<svg>` propio solo las ilustraciones (mapas del diseño), el logo de Google (varios colores) y el check animado de éxito.
