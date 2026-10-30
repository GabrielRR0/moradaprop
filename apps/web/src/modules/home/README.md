# Módulo `home`

Página de inicio pública: buscador grande, filtros rápidos, servicios clave de Venezuela (planta eléctrica, agua, fibra, vigilancia), propiedades cerca de ti, cómo funciona y llamado a publicar.

## Qué contiene

| Ruta | Página (la que importa `app/`) | Pantallas    | Diseño de origen                     |
| ---- | ------------------------------ | ------------ | ------------------------------------ |
| `/`  | `HomePage`                     | `HomeScreen` | `docs/diseno/pantallas/Main.dc.html` |

```
home/
  index.ts                 # PADRE: único punto de entrada (exporta las páginas)
  components/
    <Pagina>.tsx           # elige escritorio o móvil con <Responsive>
    <Pantalla>/            # una carpeta por pantalla: <Pantalla>.tsx, sus partes con nombre y su .css
  hooks/                   # lógica de cada pantalla (estado, datos de ejemplo, handlers)
```

- `hooks/useHomeScreen.ts` — estado y datos de ejemplo de `HomeScreen`.
- `hooks/useRentMap.ts` + `HomeScreen/HomeRentMap.tsx` — sección «¿Cuánto cuesta alquilar?» (debajo de las propiedades recientes), con el diseño del lienzo «Cuánto cuesta alquilar». Datos de `GET /api/properties/rent-stats` (todas las propiedades publicadas en USD, por estado: mediana, rango de la mayoría, mínimo, máximo e histograma). Muestra una ciudad destacada (precio típico que cuenta hacia arriba, histograma y rango) y un ranking con escala común; en el teléfono las ciudades son botones deslizables. Los colores van de verde (≤ $150) a rojo (≥ $1.000) con `rentColor` de `lib/properties/rent.ts` (la luminosidad cambia con el tema por `--rent-l`). Solo se muestran estados con 3 o más propiedades.n; en el teléfono las ciudades son botones deslizables. Los colores van de verde (≤ $150) a rojo (≥ $1.000) con `rentColor` de `lib/properties/rent.ts` (la luminosidad cambia con el tema por `--rent-l`). Solo se muestran estados con 3 o más propiedades.