import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { authenticator } from 'otplib';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { MailService } from '../../src/common/mail';
import { PrismaService } from '../../src/common/prisma';

export const WEB_HEADERS = { 'x-app-client': 'web', 'x-app-key': 'test-web-key' } as const;
export const MOBILE_HEADERS = { 'x-app-client': 'mobile', 'x-app-key': 'test-mobile-key' } as const;

/** Correo falso: guarda lo enviado para que el test lea los codigos. */
export class FakeMail {
  sent: Array<{ to: string; template: { name: string; code?: string; link?: string } }> = [];

  send = async (to: string, template: { name: string; code?: string; link?: string }) => {
    this.sent.push({ to, template });
  };

  /** Token del enlace de la ultima invitacion de agencia enviada a ese correo. */
  lastInvitationToken(to: string): string {
    const found = [...this.sent].reverse().find((m) => m.to === to && m.template.name === 'agency-invitation');
    const token = found?.template.link?.split('token=')[1];
    if (!token) throw new Error(`No hay invitacion enviada a ${to}`);
    return token;
  }

  lastCode(to: string, name?: string): string {
    const found = [...this.sent].reverse().find((m) => m.to === to && (!name || m.template.name === name));
    if (!found?.template.code) throw new Error(`No hay codigo enviado a ${to}`);
    return found.template.code;
  }
}

export interface TestApp {
  app: INestApplication;
  prisma: PrismaService;
  mail: FakeMail;
  /** Peticion con las cabeceras de la app web ya puestas. */
  web: (method: 'get' | 'post' | 'delete' | 'patch') => (url: string) => request.Test;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const mail = new FakeMail();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);

  const server = app.getHttpServer();
  return {
    app,
    prisma,
    mail,
    web: (method) => (url) => request(server)[method](url).set(WEB_HEADERS),
    close: () => app.close(),
  };
}

/** Vacia todas las tablas de negocio (la base de pruebas es solo para tests). */
export async function resetDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "AuditLog","BlockRule","ImportJob","Appointment","Favorite","PropertyImage","Property",
     "AgencyMember","AgencyProfile","TwoFactorBackupCode","VerificationCode","Session","SocialAccount","User" CASCADE`,
  );
}

/** Codigo TOTP valido. `offsetSeconds` permite generar el del paso siguiente (anti-replay). */
export const totp = (secret: string, offsetSeconds = 0) =>
  authenticator.clone({ epoch: Date.now() + offsetSeconds * 1000 }).generate(secret);

export const PASSWORD = 'Clave12345';
