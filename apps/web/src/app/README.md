# app (rutas de Next)

App Router. Cada `page.tsx` solo importa la página de su módulo (`@/modules/<modulo>`); no tiene lógica.

| Ruta                 | Módulo             | Pantalla                                                            |
| -------------------- | ------------------ | ------------------------------------------------------------------- |
| `/`                  | `home`             | Inicio                                                              |
| `/mapa`              | `map`              | Mapa + lista (escritorio) / mapa con hoja inferior (móvil)          |
| `/filtros`           | `map`              | Filtros avanzados                                                   |
| `/registro`          | `auth`             | Registro de cuenta                                                  |
| `/publicar`          | `publish`          | Publicar propiedad (6 pasos)                                        |
| `/panel`             | `dashboard-agency` | Resumen de la inmobiliaria                                          |
| `/panel/propiedades` | `dashboard-agency` | Inventario                                                          |
| `/panel/importar`    | `dashboard-agency` | Importar desde Excel                                                |
| `/panel/leads`       | `dashboard-agency` | Leads y citas                                                       |
| `/panel/equipo`      | `dashboard-agency` | Equipo y roles                                                      |
| `/propiedad/[id]`    | `properties`       | Ficha de propiedad (por ahora datos de ejemplo para cualquier `id`) |
| `/admin`             | `admin`            | Moderación (solo escritorio)                                        |
| `/diseno`            | `design`           | Kit de diseño                                                       |
| `/maplibre/[file]`   | (support)          | Route handler: sirve el worker de MapLibre desde node_modules       |

Otros archivos:

- `layout.tsx` — fuente, `ThemeProvider`, `Toaster`, `RevealObserver` y el selector de tema.
- `template.tsx` — transición suave entre páginas.
- `globals.css` — Tailwind **sin preflight** (para que se vea igual que el diseño), variables de tema, modo noche, `Responsive`, avisos y selector de tema.
- `icon.svg` — favicon.

Pendiente al conectar el API: proteger `/panel/*`, `/publicar` y `/admin` con login y rol (guards), y que
`/propiedad/[id]` lea la propiedad real.
