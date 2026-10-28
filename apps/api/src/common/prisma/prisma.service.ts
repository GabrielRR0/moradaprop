import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DbSupport } from '../../support/db';

/** Unica instancia del cliente de base de datos (como la conexion de Eloquent). */
@Injectable()
export class PrismaService extends DbSupport.PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
