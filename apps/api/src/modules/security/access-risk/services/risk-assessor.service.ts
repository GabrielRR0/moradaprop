import { Injectable } from '@nestjs/common';
import { AppConfig } from '../../../../config';
import { PrismaService } from '../../../../common/prisma';
import type { RequestContext } from '../../../../common/security/types';
import { RISK_POLICY } from '../policy';
import { scoreSignals } from '../score';
import type { RiskContext, RiskMode, RiskVerdict } from '../types';
import { networkOf } from '../utils/network';
import { DeviceRegistryService } from './device-registry.service';
import { FootprintService } from './footprint.service';

const MINUTE_MS = 60_000;

/** Reune lo que se sabe de un inicio de sesion (pais, red, dispositivo, historial, fallos) y lo puntua. */
@Injectable()
export class RiskAssessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    private readonly devices: DeviceRegistryService,
    private readonly footprints: FootprintService,
  ) {}

  get mode(): RiskMode {
    return this.config.security.riskMode;
  }

  async assess(userId: string, context: RequestContext): Promise<RiskVerdict> {
    const mode = this.mode;
    if (mode === 'off') {
      return { assessment: { level: 'LOW', score: 0, mode, reasons: [] }, device: null, country: null, network: null, hasHistory: true };
    }

    const now = new Date();
    const country = context.country ?? null;
    const network = this.footprints.networkKey(networkOf(context.ip));
    const [device, known, failedLoginsLastHour] = await Promise.all([
      this.devices.find(userId, context.deviceToken),
      this.footprints.load(userId),
      this.prisma.auditLog.count({
        where: {
          userId,
          action: 'auth.login.failed',
          createdAt: { gte: new Date(now.getTime() - RISK_POLICY.failures.windowMinutes * MINUTE_MS) },
        },
      }),
    ]);

    const risk: RiskContext = {
      now,
      country,
      network,
      device: device ? { id: device.id, confirmed: device.confirmed } : null,
      hasHistory: known.hasHistory,
      knownCountries: known.countries,
      knownNetworks: known.networks,
      lastLogin: known.lastLogin,
      failedLoginsLastHour,
    };
    const { score, level, reasons } = scoreSignals(risk);
    return { assessment: { level, score, mode, reasons }, device, country, network, hasHistory: known.hasHistory };
  }
}
