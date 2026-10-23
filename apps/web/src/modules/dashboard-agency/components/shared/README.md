# shared (dashboard-agency)

Piezas que usan varias pantallas de la inmobiliaria.

| Componente      | Para qué sirve                                                                                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AgencySidebar` | Menú lateral de escritorio. `active` resalta la sección (`resumen`, `propiedades`, `leads`, `importar`, `equipo`, `reportes`); `withPlan` agrega "Ajustes" y la tarjeta del plan (solo el resumen). Los links del menú se editan en la lista `NAV` del archivo. |
| `AgencyTabBar`  | Barra de pestañas del teléfono con el botón redondo "+" para publicar. `active` resalta la pestaña.                                                                                                                                                             |

Se dibujan dentro de la pantalla, así que toman las clases `.nav`, `.tb` y `.c` del `.css` de cada pantalla.
