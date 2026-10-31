import { Injectable } from '@nestjs/common';
import { AuditService } from '@/modules/audit';
import type { RequestContext } from '@/common/security/types';
import { DbSupport } from '@/support/db';
import type { LoginTrust, RiskVerdict } from '../../types';
import { riskMetadata } from '../../utils/risk-metadata';
import { RiskAssessorService } from '../assessment/risk-assessor.service';
import { FootprintService } from '../assessment/footprint.service';
import { DeviceRegistryService } from '../devices/device-registry.service';

/** Lo que pasa cuando un inicio de sesion se COMPLETA: registrar el dispositivo, recordar pais y red, y dejar constancia. */
@Injectable()
export class LoginTrustService {
  constructor(
    private readonly audit: AuditService,
    private readonly assessor: RiskAssessorService,
    private readonly devices: DeviceRegistryService,
    private readonly footprints: FootprintService,
  ) {}

  /**
   * El inicio de sesion se completo (clave sola, o clave + segundo factor): registra el dispositivo, recuerda el
   * pais y la red, y deja constancia. Solo se "aprende" de un inicio ALTO si paso por segundo factor.
   */
  async onLoginSuccess(user: Pick<DbSupport.User, 'id'>, context: RequestContext, verdict: RiskVerdict, factorVerified: boolean): Promise<LoginTrust> {
    if (this.assessor.mode === 'off') return { deviceId: null, country: context.country ?? null };

    const { assessment, device } = verdict;
    const learn = assessment.level !== 'HIGH' || factorVerified;
    let deviceId: string;
    let deviceSecret: string | undefined;

    if (device) {
      deviceId = device.id;
      await this.devices.touch(device.id, verdict.country);
      if (factorVerified && !device.confirmed) {
        await this.devices.confirm(device.id);
        await this.logDeviceConfirmed(user.id, device.id, device.label, context);
      }
    } else {
      // La primera entrada de la cuenta (linea base) o una verificada con segundo factor confirman el dispositivo.
      const confirmed = !verdict.hasHistory || factorVerified;
      const created = await this.devices.register(user.id, { userAgent: context.userAgent, country: verdict.country, confirmed });
      deviceId = created.id;
      deviceSecret = created.secret;
      if (confirmed) await this.logDeviceConfirmed(user.id, created.id, created.label, context);
    }

    if (learn) await this.footprints.remember(user.id, verdict.country, verdict.network);

    if (assessment.level !== 'LOW') {
      await this.audit.log({
        action: factorVerified ? 'risk.stepup.passed' : 'risk.assessed',
        userId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: riskMetadata(verdict, context, { outcome: 'allowed', factorVerified }),
      });
    }
    return { deviceId, deviceSecret, country: verdict.country };
  }

  private logDeviceConfirmed(userId: string, deviceId: string, label: string, context: RequestContext) {
    return this.audit.log({
      action: 'risk.device.confirmed',
      userId,
      resource: 'TrustedDevice',
      resourceId: deviceId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { device: label },
    });
  }
}
