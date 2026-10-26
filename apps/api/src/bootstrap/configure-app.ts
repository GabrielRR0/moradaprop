import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { LocalStorageProvider, STORAGE_PROVIDER } from '../common/storage';
import { AppConfig } from '../config';
import { ThreatModelService, threatObserver } from '../modules/security';

/** Configuracion comun de la app (la usan main.ts y los tests e2e). */
export function configureApp(app: INestApplication) {
  const config = app.get(AppConfig);

  // Con proxy delante, Express toma la IP real de X-Forwarded-For (bloqueos y rate limit).
  app.getHttpAdapter().getInstance().set('trust proxy', config.security.trustProxy);
  app.use(helmet());
  app.use(threatObserver(app.get(ThreatModelService))); // modelo de amenazas: mira cada respuesta (ver modules/threat-model)
  app.use(compression()); // gzip: el JSON del mapa y las busquedas baja a ~20% del tamano
  app.use(cookieParser());
  app.enableCors({
    origin: config.security.corsAllowedOrigins,
    credentials: true,
  });
  // Almacenamiento local: solo las variantes publicas se sirven; los originales privados nunca.
  const storage = app.get(STORAGE_PROVIDER);
  if (storage instanceof LocalStorageProvider) {
    (app as NestExpressApplication).useStaticAssets(storage.publicDir, { prefix: '/uploads', index: false, dotfiles: 'deny' });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );

  if (!config.app.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle(config.app.name).setVersion('0.0.0').addBearerAuth().build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
