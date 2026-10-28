import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { AppConfig } from './config';

// Fuera de Docker las variables salen de apps/api/.env (no pisa las que ya vengan del entorno).
if (existsSync('.env')) process.loadEnvFile('.env');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(AppConfig);
  await app.listen(config.app.port, '0.0.0.0');
  console.log(`API lista en http://localhost:${config.app.port}/api/health`);
}

void bootstrap();
