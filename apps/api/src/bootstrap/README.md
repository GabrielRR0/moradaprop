# bootstrap
configure-app.ts: configuración común de la app (la usan main.ts y los tests e2e): helmet, cookies, CORS, trust proxy, archivos locales, ValidationPipe estricto (rechaza campos desconocidos) y Swagger fuera de producción.
load-env.ts: carga apps/api/.env antes de importar la app (main.ts lo importa primero; las rutas leen ADMIN_API_PREFIX al importarse).
