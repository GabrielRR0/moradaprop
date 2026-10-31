import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { BlindIndexService } from '@/modules/security/encryption';
import { RISK_POLICY } from '../../policy';
import { DbSupport } from '@/support/db';

/**
 * Donde suele entrar cada usuario: paises y redes ya vistos. El pais se guarda tal cual (2 letras); la red solo
 * como HMAC (BlindIndexService), asi la base no acumula IPs. Solo se anota tras un inicio de sesion completo.
 */
@Injectable()
export class FootprintService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly index: BlindIndexService,
  ) {}

  /** HMAC de una red (ej. "190.120.5.0/24"), o null si no hay red. */
  networkKey(network: string | null): string | null {
    return network ? this.index.hash('LoginFootprint.network', network) : null;
  }

  async load(userId: string) {
    const rows = await this.prisma.loginFootprint.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
      take: RISK_POLICY.footprintsPerKind * 2,
    });
    const countries = rows.filter((r) => r.kind === DbSupport.FootprintKind.COUNTRY);
    return {
      hasHistory: rows.length > 0,
      countries: new Set(countries.map((r) => r.value)),
      networks: new Set(rows.filter((r) => r.kind === DbSupport.FootprintKind.NETWORK).map((r) => r.value)),
      lastLogin: countries[0] ? { country: countries[0].value, at: countries[0].lastSeenAt } : null,
    };
  }

  /** Anota el pais y la red de un inicio de sesion completo (y olvida los mas antiguos pasado el tope). */
  async remember(userId: string, country: string | null, networkKey: string | null): Promise<void> {
    const entries: Array<[DbSupport.FootprintKind, string | null]> = [
      [DbSupport.FootprintKind.COUNTRY, country],
      [DbSupport.FootprintKind.NETWORK, networkKey],
    ];
    for (const [kind, value] of entries) {
      if (!value) continue;
      await this.prisma.loginFootprint.upsert({
        where: { userId_kind_value: { userId, kind, value } },
        create: { userId, kind, value },
        update: { lastSeenAt: new Date(), seenCount: { increment: 1 } },
      });
      await this.prune(userId, kind);
    }
  }

  private async prune(userId: string, kind: DbSupport.FootprintKind): Promise<void> {
    const stale = await this.prisma.loginFootprint.findMany({
      where: { userId, kind },
      orderBy: { lastSeenAt: 'desc' },
      skip: RISK_POLICY.footprintsPerKind,
      select: { id: true },
    });
    if (stale.length > 0) await this.prisma.loginFootprint.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }
}
