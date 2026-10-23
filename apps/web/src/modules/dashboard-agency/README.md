# Módulo `dashboard-agency`

Panel de inmobiliarias: resumen, inventario de propiedades (tabla/tarjetas, selección múltiple, cambio de estado), importación desde Excel, tablero de leads y citas, y equipo con roles. Cada pantalla tiene su versión móvil con barra inferior.

## Qué contiene

| Ruta                 | Página (la que importa `app/`) | Pantallas                                           | Diseño de origen                           |
| -------------------- | ------------------------------ | --------------------------------------------------- | ------------------------------------------ |
| `/panel`             | `DashboardPage`                | `DashboardScreen` + `DashboardMobileScreen` (móvil) | `docs/diseno/pantallas/Panel.dc.html`      |
| `/panel/propiedades` | `InventoryPage`                | `InventoryScreen` + `InventoryMobileScreen` (móvil) | `docs/diseno/pantallas/Inventario.dc.html` |
| `/panel/importar`    | `ImportPage`                   | `ImportScreen` + `ImportMobileScreen` (móvil)       | `docs/diseno/pantallas/Importar.dc.html`   |
| `/panel/leads`       | `LeadsPage`                    | `LeadsScreen` + `LeadsMobileScreen` (móvil)         | `docs/diseno/pantallas/Leads.dc.html`      |
| `/panel/equipo`      | `TeamPage`                     | `TeamScreen` + `TeamMobileScreen` (móvil)           | `docs/diseno/pantallas/Equipo.dc.html`     |

```
dashboard-agency/
  index.ts                 # PADRE: único punto de entrada (exporta las páginas)
  components/
    <Pagina>.tsx           # elige escritorio o móvil con <Responsive>
    <Pantalla>/            # una carpeta por pantalla: <Pantalla>.tsx, sus partes con nombre y su .css
  hooks/                   # lógica de cada pantalla (estado, datos de ejemplo, handlers)
```

- `hooks/useDashboardScreen.ts` — estado y datos de ejemplo de `DashboardScreen`.
- `hooks/useDashboardMobileScreen.ts` — estado y datos de ejemplo de `DashboardMobileScreen`.
- `hooks/useInventoryScreen.ts` — estado y datos de ejemplo de `InventoryScreen`.
- `hooks/useInventoryMobileScreen.ts` — estado y datos de ejemplo de `InventoryMobileScreen`.
- `hooks/useImportScreen.ts` — estado y datos de ejemplo de `ImportScreen`.
- `hooks/useImportMobileScreen.ts` — estado y datos de ejemplo de `ImportMobileScreen`.
- `hooks/useLeadsScreen.ts` — estado y datos de ejemplo de `LeadsScreen`.
- `hooks/useLeadsMobileScreen.ts` — estado y datos de ejemplo de `LeadsMobileScreen`.
- `hooks/useTeamScreen.ts` — estado y datos de ejemplo de `TeamScreen`.
- `hooks/useTeamMobileScreen.ts` — estado y datos de ejemplo de `TeamMobileScreen`.

## Cómo funciona

- Cada pantalla es el diseño convertido a React: el JSX conserva los estilos del diseño y el CSS
  de la pantalla va **acotado** bajo su clase raíz (`.ds-<pantalla>`), así no se pisa con otras.
- La lógica vive en el hook de la pantalla y devuelve un objeto `v` que el JSX consume (equivale al
  `renderVals()` del diseño). Los **datos son de ejemplo** y están dentro del hook: al conectar el API
  se reemplazan por llamadas a `services/` (TanStack Query) sin tocar el JSX.
- El tema (color de marca `--ac` y modo noche) sale de `src/app/globals.css` + `ThemeProvider`.
- Escritorio y móvil se alternan por CSS (`<Responsive>`, corte en 900 px).
- Los avisos (`toast`) y la navegación entre pantallas están en los hooks (`hooks/use<Pantalla>.ts`).

## Reglas

- Fuera de este módulo solo se importa `index.ts` (regla ESLint `local/no-internal-imports`).
- Máximo 600 líneas por archivo: las pantallas grandes se parten en partes con nombre (ej. `HomeIntro`, `HomeListings`).
- Estas pantallas ya se mantienen **a mano**: el conversor del diseño quedó retirado (ver `scripts/diseno-a-react/README.md`).
