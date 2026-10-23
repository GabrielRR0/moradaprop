# Módulo `auth`

Registro de cuenta en 3 pasos (perfil: cliente / dueño / inmobiliaria, datos, código de 6 dígitos) y pantalla de éxito. El mensaje lateral cambia según el perfil.

## Qué contiene

| Ruta        | Página (la que importa `app/`) | Pantallas                                         | Diseño de origen                         |
| ----------- | ------------------------------ | ------------------------------------------------- | ---------------------------------------- |
| `/registro` | `RegisterPage`                 | `RegisterScreen` + `RegisterMobileScreen` (móvil) | `docs/diseno/pantallas/Registro.dc.html` |

```
auth/
  index.ts                 # PADRE: único punto de entrada (exporta las páginas)
  components/
    <Pagina>.tsx           # elige escritorio o móvil con <Responsive>
    <Pantalla>/            # una carpeta por pantalla: <Pantalla>.tsx, sus partes con nombre y su .css
  hooks/                   # lógica de cada pantalla (estado, datos de ejemplo, handlers)
```

- `hooks/useRegisterScreen.ts` — estado y datos de ejemplo de `RegisterScreen`.
- `hooks/useRegisterMobileScreen.ts` — estado y datos de ejemplo de `RegisterMobileScreen`.

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
