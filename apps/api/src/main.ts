import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { AppConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(AppConfig);
  await app.listen(config.app.port, '0.0.0.0');
  console.log(`API lista en http://localhost:${config.app.port}/api/health`);
}

void bootstrap();
