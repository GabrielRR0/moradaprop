# Módulo `properties`

Ficha de propiedad para el cliente: galería, datos, servicios, mapa de zona aproximada, agente, contacto con el anunciante (interesado, pregunta, visita y WhatsApp) y propiedades parecidas.

## Qué contiene

| Ruta                 | Página (la que importa `app/`) | Pantallas                                         | Diseño de origen                      |
| -------------------- | ------------------------------ | ------------------------------------------------- | ------------------------------------- |
| `/propiedad/ejemplo` | `PropertyPage`                 | `PropertyScreen` + `PropertyMobileScreen` (móvil) | `docs/diseno/pantallas/Ficha.dc.html` |

```
properties/
  index.ts                 # PADRE: único punto de entrada (exporta las páginas)
  components/
    <Pagina>.tsx           # elige escritorio o móvil con <Responsive>
    <Pantalla>/            # una carpeta por pantalla: <Pantalla>.tsx, sus partes con nombre y su .css
  hooks/                   # lógica de cada pantalla (estado, datos de ejemplo, handlers)
```

- `hooks/usePropertyBooking.ts` — carga la propiedad del API, favoritos y propiedades parecidas (lo comparten escritorio y móvil).
- `hooks/usePropertyContact.ts` — escribirle al anunciante: qué se puede hacer según el estado de la propiedad, el mensaje y su envío. Las opciones están en `hooks/contact-options.ts`.
- `hooks/usePropertyScreen.ts` y `hooks/usePropertyMobileScreen.ts` — lo propio de cada pantalla.
- `components/ContactPanel/` — los botones **Estoy interesado**, **Tengo una pregunta**, **Pedir una visita**, WhatsApp y Apartar, y la ventana para escribir. El cliente nunca elige fecha: el anunciante propone y el cliente acepta (ver `modules/inbox`).

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
