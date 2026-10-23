# config (web)

Única capa que lee variables de entorno (regla ESLint `no-process-env`).

- `env.ts` — **único** archivo con `process.env`. `publicEnv` (variables `NEXT_PUBLIC_*`, visibles en el navegador) y `serverEnv` (solo servidor).
- `brand.ts` — nombre y eslogan de la plataforma. Nunca se escribe el nombre a mano: `brand.name`.
- `index.ts` — archivo padre.
- `tests/` — pruebas de la config.

Variables de la web (documentadas en `.env.example`): `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_APP_CLIENT_KEY`, `NEXT_PUBLIC_SHOW_THEME_PICKER` (selector flotante de tema),
`NEXT_PUBLIC_WHATSAPP_NUMBER` (contacto de ejemplo).
