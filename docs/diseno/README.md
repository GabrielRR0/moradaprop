# Diseño de la plataforma

Copia local del diseño de la plataforma (pantallas, modo noche y color de marca variable).

- `canvas.json` — índice del lienzo: lista de pantallas, posición, tamaño y títulos.
- `pantallas/` — una pantalla por archivo `.dc.html` (marcado + estilos + lógica de ejemplo). Ver su README.

## Mapa de pantallas

| # | Archivo | Qué es | Ruta en la app |
|---|---|---|---|
| 1 | `Main` | Inicio (web) | `/` |
| 2 | `Mapa` | Mapa + lista (escritorio) | `/mapa` |
| 3 | `Filtros` | Filtros avanzados (Básico/Avanzado) | `/filtros` |
| 4 | `Movil` | Mapa móvil, modo noche | `/mapa` (móvil) |
| 5 | `Kit` | Kit: color, pines, cards, movimiento | `/diseno` |
| 6 | `Registro` / `MRegistro` | Registro de cuenta | `/registro` |
| 7 | `Publicar` / `MPublicar` | Publicar propiedad (6 pasos) | `/publicar` |
| 8 | `Panel` / `MPanel` | Panel de inmobiliaria | `/panel` |
| 9 | `Inventario` / `MInventario` | Inventario de propiedades | `/panel/propiedades` |
| 10 | `Importar` / `MImportar` | Importar desde Excel | `/panel/importar` |
| 11 | `Leads` / `MLeads` | Leads y citas (tablero) | `/panel/leads` |
| 12 | `Equipo` / `MEquipo` | Equipo y permisos | `/panel/equipo` |
| 13 | `Ficha` / `MFicha` | Ficha de propiedad (cliente) | `/propiedad/[id]` |
| 14 | `Admin` | Administrador: moderación | `/admin` |
| 15–30 | `*Noche` | Copias en modo noche de pantallas clave | (el modo noche es el interruptor del tema) |

(`M…` = versión móvil. Las copias `*Noche` se guardan como referencia visual; en la app el modo noche es el
selector de tema, no rutas aparte.)

## Decisiones de diseño

- **Una sola variable de color de marca** (`--ac`); el resto son neutros. Opciones en estudio: azul `#2563EB`,
  violeta `#5B4BE8` (recomendado), verde `#0E8A5F`, terracota `#C2410C`. Se cambia con el botón flotante de
  la app (o `ACCENTS` en `apps/web/src/lib/theme.tsx`).
- **Modo noche** con `data-theme="dark"`; el color de marca se aclara solo.
- **Tipografía:** Plus Jakarta Sans (400–800).
- **Mapa:** pines con precio (disponible, seleccionado, ya visto, en reserva, favorito), grupos con halo que late.
- **Pensado para venezolanos sin experiencia:** una acción principal por pantalla, filtros por servicios locales
  (planta eléctrica, agua, fibra, vigilancia), WhatsApp como contacto principal, USD con opción de Bs.
- **Movimiento con propósito:** pines que caen, tarjetas que suben, corazón con pulso, transiciones de página,
  avisos al guardar/cambiar; todo se apaga con "reducir movimiento" del sistema.
- **Móvil primero para inmobiliarias:** barra inferior con botón central "+", botones ≥ 44 px, listas que se
  deslizan de lado.

## Cómo volver a ver el diseño

Los `.dc.html` se renderizan con el runtime del lienzo de diseño (no se abren en el navegador directamente).
Para verlos, abre el enlace del lienzo o mira la app ya convertida (`pnpm dev:web`, rutas de la tabla).
Conversión: `scripts/diseno-a-react/README.md`.
