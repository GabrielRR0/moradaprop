# Guía para leer el frontend (`apps/web`)

Cómo está armado y dónde tocar cada cosa. Pensada para alguien que abre el código por primera vez.

## 1. De la URL a la pantalla

```
URL  /panel/propiedades
 └─ src/app/panel/propiedades/page.tsx        solo importa la página de su módulo
     └─ modules/dashboard-agency/index.ts     archivo padre del módulo (lo único que se importa desde fuera)
         └─ components/InventoryPage.tsx      elige escritorio o móvil
             ├─ InventoryScreen/              escritorio
             └─ InventoryMobileScreen/        teléfono
```

Cada carpeta de pantalla tiene siempre las mismas piezas:

| Pieza | Qué es |
|---|---|
| `<Pantalla>.tsx` | El componente: arma la pantalla y llama a su hook. |
| partes con nombre (`InventoryTable.tsx`, …) | Trozos de la pantalla; existen para que ningún archivo pase de 600 líneas. |
| `<pantalla>.css` | Estilos propios (clases del diseño como `.btn`, `.card`, animaciones). Van acotados bajo `.ds-<pantalla>` para no mezclarse con otras pantallas. |
| `hooks/use<Pantalla>.ts` (en el módulo) | El estado, los datos de ejemplo y las acciones. El JSX solo **lee** lo que este hook devuelve (`v.items`, `v.next`…). |

## 2. Dónde cambiar qué

| Quiero… | Voy a… |
|---|---|
| cambiar un texto o el orden de una pantalla | el `.tsx` de esa pantalla o su parte |
| cambiar los datos de ejemplo o lo que hace un botón | el hook `use<Pantalla>.ts` |
| cambiar el color de marca, el modo noche o los grises | `app/globals.css` (variables `--ac`, `--bg`, `--surf`, …) y `lib/theme.tsx` |
| agregar o cambiar un icono | `components/icons/paths.tsx` y se usa con `<Icon name="…" />` |
| cambiar el menú lateral o la barra de pestañas de la inmobiliaria | `dashboard-agency/components/shared/AgencySidebar.tsx` y `AgencyTabBar.tsx` |
| mostrar un aviso ("Guardado") | `toast("texto")` de `lib/toast` |
| cambiar el nombre de la plataforma | `NEXT_PUBLIC_APP_NAME` (se lee en `config/brand.ts`) |
| conectar una pantalla al API | crear `services/` en su módulo (ejemplo ya hecho: `modules/map/services`) y reemplazar los datos del hook |

## 3. Piezas compartidas

- `components/icons` — `<Icon>`; el icono toma el color del texto.
- `components/Responsive` / `ClientResponsive` — escritorio vs. teléfono (corte en 900 px).
- `components/Toaster`, `ThemePicker`, `RevealObserver`, `Providers` — se montan una vez en `app/layout.tsx`.
- `lib/` — `theme` (modo noche y color), `toast`, `whatsapp`, `dc` (`css("a:b")` → estilo de React).
- `config/` — única capa que lee variables de entorno.

## 4. Reglas que cuida ESLint

- De otro módulo solo se importa su `index.ts`.
- Máximo 600 líneas por archivo.
- Nadie lee `process.env` fuera de `config/`.

## 5. Cómo se ve igual que el diseño

El diseño (`docs/diseno/`) trae estilos "en línea" y cada pantalla conserva los suyos; por eso hay muchos
`style={{ … }}` en el JSX. Lo repetido ya se sacó a componentes (iconos, barra lateral, pestañas, ficha flotante,
menús desplegables). Si una pieza se repite en 3 pantallas, el siguiente paso es extraerla igual.
