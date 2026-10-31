import { Injectable } from '@nestjs/common';
import { AuditService } from '@/modules/audit';
import type { RequestContext } from '@/common/security/types';
import type { SessionRef } from '../../types';
import { RiskAssessorService } from '../assessment/risk-assessor.service';
import { DeviceRegistryService } from '../devices/device-registry.service';

/** Defensa del robo del refresh token: una sesion solo se renueva desde su dispositivo (y sin cambiar de pais). */
@Injectable()
export class RefreshGuardService {
  constructor(
    private readonly audit: AuditService,
    private readonly assessor: RiskAssessorService,
    private readonly devices: DeviceRegistryService,
  ) {}

  /**
   * Renovacion de sesion (refresh): una sesion con dispositivo solo se renueva desde ESE dispositivo; una anterior a
   * esta funcion, mientras no cambie de pais. Si no, se revoca (en `enforce`) y hay que iniciar sesion de nuevo, que
   * pasa por la medicion completa. Defiende el robo del refresh token.
   */
  async checkRefresh(session: SessionRef, context: RequestContext): Promise<'ok' | 'revoke'> {
    const mode = this.assessor.mode;
    if (mode === 'off') return 'ok';

    const country = context.country ?? null;
    let reason: 'device-mismatch' | 'country-change' | null = null;

    if (session.deviceId) {
      const presented = await this.devices.find(session.userId, context.deviceToken);
      if (presented?.id !== session.deviceId) {
        reason = 'device-mismatch';
      } else {
        await this.devices.touch(presented.id, country);
        if (country && session.country && country !== session.country) {
          // Mismo dispositivo en otro pais (viaje o VPN): se permite y se avisa.
          await this.audit.log({
            action: 'risk.assessed',
            userId: session.userId,
            ip: context.ip,
            userAgent: context.userAgent,
            metadata: { level: 'MEDIUM', mode, outcome: 'allowed', country, device: presented.label, reasons: [{ signal: 'refresh-new-country', points: 0, reason: `la sesion paso de ${session.country} a ${country}` }] },
          });
        }
      }
    } else if (session.country && country && session.country !== country) {
      reason = 'country-change';
    }

    if (!reason) return 'ok';
    await this.audit.log({
      action: 'risk.session.revoked',
      userId: session.userId,
      resource: 'Session',
      resourceId: session.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { reason, country, mode, revoked: mode === 'enforce' },
    });
    return mode === 'enforce' ? 'revoke' : 'ok';
  }
}
