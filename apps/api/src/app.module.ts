import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { CacheSupport } from './support/cache';
import { CryptoModule } from './common/crypto';
import { AppGraphqlModule } from './common/graphql/app-graphql.module';
import { ImagesSupport } from './support/images';
import { MailSupport } from './support/mail';
import { TurnstileSupport } from './support/turnstile';
import { PrismaModule } from './common/prisma';
import { GlobalGuardsModule } from './common/security/global-guards.module';
import { StorageModule } from './common/storage';
import { ConfigModule } from './config';
import { AdminUsersModule } from './modules/admin-users';
import { AgenciesModule } from './modules/agencies';
import { AppointmentsModule } from './modules/appointments';
import { AuditModule } from './modules/audit';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health/health.module';
import { ImportsModule } from './modules/imports';
import { PropertiesModule } from './modules/properties';
import { ReplyTemplatesModule } from './modules/reply-templates';
import { SecurityModule } from './modules/security';
import { SettingsModule } from './modules/settings';
import { UsersModule } from './modules/users';
import { appRoutes } from './routes';

@Module({
  imports: [
    // Infraestructura comun
    ConfigModule,
    PrismaModule,
    CryptoModule,
    CacheSupport.Module,
    MailSupport.Module,
    TurnstileSupport.Module,
    StorageModule,
    ImagesSupport.Module,
    AppGraphqlModule,
    // Modulos de negocio
    AuditModule,
    SecurityModule,
    AuthModule,
    UsersModule,
    AdminUsersModule,
    SettingsModule,
    PropertiesModule,
    AgenciesModule,
    AppointmentsModule,
    ReplyTemplatesModule,
    ImportsModule,
    HealthModule,
    // Guards globales y rutas
    GlobalGuardsModule,
    RouterModule.register(appRoutes),
  ],
})
export class AppModule {}
