import './bootstrap/load-env'; // primero: las rutas leen el entorno al importarse
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { AppConfig } from './config';

// Si algo se cae fuera de una peticion (o al arrancar), que quede en el log en vez de matar la funcion sin explicacion.
const logger = new Logger('Process');
process.on('unhandledRejection', (reason) => logger.error(`unhandledRejection: ${reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)}`));
process.on('uncaughtException', (error) => logger.error(`uncaughtException: ${error.stack ?? error.message}`));

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(AppConfig);
  await app.listen(config.app.port, '0.0.0.0');
  console.log(`API lista en http://localhost:${config.app.port}/api/health`);
}

bootstrap().catch((error: unknown) => {
  logger.error(`No se pudo arrancar la API: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
  process.exit(1);
});
