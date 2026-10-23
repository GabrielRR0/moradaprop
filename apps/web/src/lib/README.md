# lib

Utilidades compartidas de la web (no pertenecen a un módulo).

| Archivo       | Para qué sirve                                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dc.ts`       | `css("a:b; c:d")` convierte un string CSS en objeto `style` (lo usan los estilos del diseño con valores calculados) y el tipo `Vals` (lo que devuelve el hook de cada pantalla).                                        |
| `theme.tsx`   | `ThemeProvider` / `useTheme()`: modo noche y color de marca (`--ac`). Guarda la elección en `localStorage` (`theme`, `accent`). `ACCENTS` lista los colores en estudio y `themeInitScript` evita el parpadeo al cargar. |
| `toast.ts`    | `toast("texto", "ok" \| "info" \| "warn")`: avisos breves desde cualquier hook. Los dibuja `components/Toaster`.                                                                                                        |
| `whatsapp.ts` | `whatsappUrl(mensaje?, telefono?)`: enlace `wa.me` con mensaje listo. Número de ejemplo en `NEXT_PUBLIC_WHATSAPP_NUMBER`.                                                                                               |

El color de marca y los neutros viven como variables CSS en `app/globals.css`; `theme.tsx` solo cambia `--ac` y `data-theme`.
