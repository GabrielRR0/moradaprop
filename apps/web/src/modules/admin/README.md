# Módulo `admin`

Administración. Hoy tiene dos pantallas: **Ajustes de la plataforma** (`/admin/ajustes`, conectada a la API) y la **moderación de anuncios** (`/admin`, con datos de ejemplo: cola de revisión, aprobar / pedir cambios / rechazar y auditoría reciente; solo escritorio, en el teléfono muestra un aviso).

## Ajustes de la plataforma (`/admin/ajustes`)
El admin configura el **correo con Resend** (API key, correo y nombre del remitente) sin tocar variables de entorno, y puede enviar un correo de prueba. La pantalla dice de dónde sale hoy el correo: de la clave guardada o de las variables `MAIL_*` del servidor. Todo se guarda cifrado en la base y, si hay algo guardado, manda sobre las variables. Guardar o quitar pide confirmar el segundo factor (`ConfirmIdentitySheet`, de `modules/auth`). Las rutas cuelgan de `NEXT_PUBLIC_ADMIN_API_PREFIX` (igual a `ADMIN_API_PREFIX` de la API). Si la cuenta no tiene 2FA activo, la pantalla lo explica y lleva a activarlo. Llamadas y reintento tras confirmar: `src/lib/admin`.

## Qué contiene

| Ruta     | Página (la que importa `app/`) | Pantallas     | Diseño de origen                      |
| -------- | ------------------------------ | ------------- | ------------------------------------- |
| `/admin` | `AdminPage`                    | `AdminScreen` | `docs/diseno/pantallas/Admin.dc.html` |

```
admin/
  index.ts                 # PADRE: único punto de entrada (exporta las páginas)
  components/
    <Pagina>.tsx           # elige escritorio o móvil con <Responsive>
    <Pantalla>/            # una carpeta por pantalla: <Pantalla>.tsx, sus partes con nombre y su .css
  hooks/                   # lógica de cada pantalla (estado, datos de ejemplo, handlers)
```

- `hooks/useAdminScreen.ts` — estado y datos de ejemplo de `AdminScreen`.

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
