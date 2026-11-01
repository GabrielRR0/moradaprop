import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { MailSupport } from '../../src/support/mail';
import { TurnstileSupport } from '../../src/support/turnstile';
import { TotpSupport } from '../../src/support/totp';
import { PrismaService } from '../../src/common/prisma';
import { ResourceContractInterceptor } from './resource-contract';

export const WEB_HEADERS = { 'x-app-client': 'web', 'x-app-key': 'test-web-key' } as const;
export const MOBILE_HEADERS = { 'x-app-client': 'mobile', 'x-app-key': 'test-mobile-key' } as const;

/** Correo falso: guarda lo enviado para que el test lea los codigos. */
export class FakeMail {
  sent: Array<{ to: string; template: { name: string; code?: string; link?: string } }> = [];

  send = async (to: string, template: { name: string; code?: string; link?: string }) => {
    this.sent.push({ to, template });
  };

  /** Si es true, `sendOrThrow` falla como lo haria un servidor de correo con una clave mala. */
  failNext = false;

  sendOrThrow = async (to: string, template: { name: string; code?: string; link?: string }) => {
    if (this.failNext) throw new Error('Invalid login: 535 Authentication failed');
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
  web: (method: 'get' | 'post' | 'put' | 'delete' | 'patch') => (url: string) => request.Test;
  close: () => Promise<void>;
}

/** Verificador falso de Turnstile para las pruebas (no se llama a Cloudflare). */
export interface FakeTurnstile {
  verify: (token: string, ip?: string) => Promise<TurnstileSupport.Result>;
}

export async function createTestApp(options: { turnstile?: FakeTurnstile } = {}): Promise<TestApp> {
  const mail = new FakeMail();
  let builder = Test.createTestingModule({ imports: [AppModule] }).overrideProvider(MailSupport.Service).useValue(mail);
  if (options.turnstile) builder = builder.overrideProvider(TurnstileSupport.Service).useValue(options.turnstile);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  configureApp(app);
  // Comprueba que cada respuesta cumple el Resource que declara su ruta (ver resource-contract.ts).
  app.useGlobalInterceptors(new ResourceContractInterceptor());
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
    `TRUNCATE "PlatformSetting","AuditLog","BlockRule","ImportJob","Appointment","Favorite","PropertyImage","Property",
     "AgencyMember","AgencyProfile","TwoFactorBackupCode","VerificationCode","Session","SocialAccount","User" CASCADE`,
  );
}

/** Codigo TOTP valido. `offsetSeconds` permite generar el del paso siguiente (anti-replay). */
export const totp = TotpSupport.generate;

export const PASSWORD = 'Clave12345';
