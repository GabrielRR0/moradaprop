import { ForbiddenException, Injectable } from '@nestjs/common';
import type { BlockRule } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';
import { ipInCidr, normalizeIp } from '../utils/cidr';

export interface BlockContext {
  ip?: string;
  country?: string;
  userId?: string;
  email?: string;
}

const CACHE_TTL_MS = 30_000;

/** Decide si una peticion esta bloqueada. Las reglas se cachean 30s. */
@Injectable()
export class BlockCheckService {
  private cache: { rules: BlockRule[]; loadedAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  invalidate() {
    this.cache = null;
  }

  async isBlocked(context: BlockContext): Promise<boolean> {
    const rules = await this.activeRules();
    const ip = context.ip ? normalizeIp(context.ip) : undefined;
    const country = context.country?.toUpperCase();
    const email = context.email?.toLowerCase();
    const domain = email?.split('@')[1];

    return rules.some((rule) => {
      switch (rule.type) {
        case 'IP':
          return ip !== undefined && normalizeIp(rule.value) === ip;
        case 'CIDR':
          return ip !== undefined && ipInCidr(ip, rule.value);
        case 'COUNTRY':
          return country !== undefined && rule.value.toUpperCase() === country;
        case 'USER':
          return context.userId !== undefined && rule.value === context.userId;
        case 'EMAIL':
          return email !== undefined && rule.value.toLowerCase() === email;
        case 'EMAIL_DOMAIN':
          return domain !== undefined && rule.value.toLowerCase() === domain;
      }
    });
  }

  /** Lanza 403 con un mensaje generico (no revela el motivo ni la regla). */
  async assertNotBlocked(context: BlockContext): Promise<void> {
    if (await this.isBlocked(context)) {
      throw new ForbiddenException('Acceso restringido');
    }
  }

  private async activeRules(): Promise<BlockRule[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.loadedAt < CACHE_TTL_MS) {
      return this.cache.rules.filter((r) => !r.expiresAt || r.expiresAt.getTime() > now);
    }
    const rules = await this.prisma.blockRule.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    });
    this.cache = { rules, loadedAt: now };
    return rules;
  }
}
