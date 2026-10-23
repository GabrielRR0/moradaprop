import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { describeCase } from '../support/describe-case';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describeCase('health (e2e)', {
    que: 'GET /api/health responde 200 con status ok',
    espera: 'codigo 200 y cuerpo { status: "ok" }',
    ejecutar: async () => {
      const respuesta = await request(app.getHttpServer()).get('/api/health');
      return { codigo: respuesta.status, cuerpo: respuesta.body };
    },
    verificar: ({ codigo, cuerpo }) => {
      expect(codigo).toBe(200);
      expect(cuerpo.status).toBe('ok');
    },
  });

  describeCase('health (e2e)', {
    que: 'una ruta inexistente responde 404',
    espera: 'codigo 404',
    ejecutar: async () => (await request(app.getHttpServer()).get('/api/no-existe')).status,
    verificar: (codigo) => expect(codigo).toBe(404),
  });
});
