import { existsSync } from 'node:fs';

/**
 * Fuera de Docker las variables salen de apps/api/.env (no pisa las que ya vengan del entorno).
 * main.ts lo importa PRIMERO: las rutas (routes/) leen el entorno al importarse, antes de crear la app.
 */
if (existsSync('.env')) process.loadEnvFile('.env');
