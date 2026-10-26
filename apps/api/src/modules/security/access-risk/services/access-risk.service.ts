import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AppConfig } from '../../../../config';
import { PrismaService } from '../../../../common/prisma';
import type { RequestContext } from '../../../../common/security/types';
import { AuditService } from '../../../audit';
import { ThreatModelService } from '../../threat-model';
import { RISK_POLICY } from '../policy';
import { SIGNALS } from '../signals';
import type { LoginTrust, RiskMode, RiskVerdict } from '../types';
import { deviceLabel } from '../utils/device-label';
import { DeviceRegistryService } from './device-registry.service';
import { FootprintService } from './footprint.service';
import { RiskAssessorService } from './risk-assessor.service';

const MINUTE_MS = 60_000;

/** Sesion que se renueva (lo que el refresh necesita saber para compararla con quien llega). */
export interface SessionRef {
  id: string;
  userId: string;
  deviceId: string | null;
  country: string | null;
}

/**
 * Fachada del riesgo de inicio de sesion: lo UNICO que `auth` usa. Mide cada inicio de sesion (pais, red,
 * dispositivo), decide si hay que pedir segundo factor, recuerda lo habitual y vigila la renovacion de sesiones.
 */
@Injectable()
export class AccessRiskService implements OnModuleInit {
  private readonly logger = new Logger(AccessRiskService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly assessor: RiskAssessorService,
    private readonly devices: DeviceRegistryService,
    private readonly footprints: FootprintService,
    private readonly threats: ThreatModelService,
  ) {}

  get mode(): RiskMode {
    return this.assessor.mode;
  }

  onModuleInit() {
    if (!this.config.app.isProduction) return;
    if (this.mode !== 'enforce') this.logger.warn(`RISK_MODE=${this.mode}: en produccion usa "enforce" para que los inicios de sesion raros exijan segundo factor`);
    if (this.mode !== 'off' && !this.config.security.trustProxy) {
      this.logger.warn('TRUST_PROXY=false: sin CDN delante el pais de cada inicio de sesion es desconocido; solo se mide red nueva, dispositivo nuevo y fallos');
    }
  }

  /** Mide un inicio de sesion. No cambia nada. */
  assess(user: Pick<User, 'id'>, context: RequestContext): Promise<RiskVerdict> {
    return this.assessor.assess(user.id, context);
  }

  /**
   * Metodos de segundo paso que se ofrecen segun lo que el usuario TIENE. La passkey va primero (la mas fuerte).
   * El codigo por correo solo acompaña a la app autenticadora y se quita en un inicio ALTO (con enforce): no prueba nada fuerte.
   */
  challengeMethods(verdict: RiskVerdict, factors: { totp: boolean; passkey: boolean }): Array<'passkey' | 'totp' | 'backup' | 'email'> {
    const methods: Array<'passkey' | 'totp' | 'backup' | 'email'> = [];
    if (factors.passkey) methods.push('passkey');
    if (factors.totp) methods.push('totp', 'backup');
    if (factors.totp && !this.requiresStrongFactor(verdict)) methods.push('email');
    return methods;
  }

  /**
   * Agregar, cambiar o quitar un metodo de verificacion (passkey, 2FA) solo se permite desde un dispositivo CONFIRMADO
   * (con enforce). Si no, un atacante que solo conoce la clave podria registrar SU passkey y dejar fuera al dueño.
   */
  async assertTrustedContext(user: Pick<User, 'id'>, context: RequestContext): Promise<void> {
    if (this.mode !== 'enforce') return;
    const device = await this.devices.find(user.id, context.deviceToken);
    if (device?.confirmed) return;
    await this.audit.log({
      action: 'risk.factor.denied',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { outcome: 'denied', country: context.country ?? null, device: device?.label ?? deviceLabel(context.userAgent), reasons: [{ signal: 'untrusted-device', points: 0, reason: 'cambio de verificacion desde un dispositivo sin confirmar' }] },
    });
    throw new ForbiddenException({
      message: 'Por seguridad, agrega o cambia tus metodos de verificacion desde un dispositivo que ya hayas confirmado',
      code: 'TRUSTED_DEVICE_REQUIRED',
    });
  }

  /** ¿Hay que exigir un factor fuerte (y no aceptar el codigo por correo)? Solo en `enforce` y con riesgo ALTO. */
  requiresStrongFactor(verdict: Pick<RiskVerdict, 'assessment'>): boolean {
    return verdict.assessment.mode === 'enforce' && verdict.assessment.level === 'HIGH';
  }

  /**
   * Riesgo ALTO y la cuenta no tiene ningun segundo factor: no se entra. Se le indica activar uno desde un
   * dispositivo conocido (registrar un factor desde un lugar raro dejaria fuera al dueño).
   */
  async assertCanProceed(user: Pick<User, 'id'>, verdict: RiskVerdict, hasSecondFactor: boolean, context: RequestContext) {
    if (!this.requiresStrongFactor(verdict) || hasSecondFactor) return;
    await this.audit.log({
      action: 'risk.denied',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: this.metadata(verdict, context, { outcome: 'denied' }),
    });
    throw new ForbiddenException({
      message: 'Por seguridad, entra desde tu dispositivo habitual y activa passkey o verificacion en dos pasos para poder entrar desde otros lugares',
      code: 'SECOND_FACTOR_REQUIRED',
    });
  }

  /**
   * El inicio de sesion se completo (clave sola, o clave + segundo factor): registra el dispositivo, recuerda el
   * pais y la red, y deja constancia. Solo se "aprende" de un inicio ALTO si paso por segundo factor.
   */
  async onLoginSuccess(user: Pick<User, 'id'>, context: RequestContext, verdict: RiskVerdict, factorVerified: boolean): Promise<LoginTrust> {
    if (this.mode === 'off') return { deviceId: null, country: context.country ?? null };

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
        metadata: this.metadata(verdict, context, { outcome: 'allowed', factorVerified }),
      });
    }
    return { deviceId, deviceSecret, country: verdict.country };
  }

  /**
   * Renovacion de sesion (refresh): una sesion con dispositivo solo se renueva desde ESE dispositivo; una anterior a
   * esta funcion, mientras no cambie de pais. Si no, se revoca (en `enforce`) y hay que iniciar sesion de nuevo, que
   * pasa por la medicion completa. Defiende el robo del refresh token.
   */
  async checkRefresh(session: SessionRef, context: RequestContext): Promise<'ok' | 'revoke'> {
    if (this.mode === 'off') return 'ok';

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
            metadata: { level: 'MEDIUM', mode: this.mode, outcome: 'allowed', country, device: presented.label, reasons: [{ signal: 'refresh-new-country', points: 0, reason: `la sesion paso de ${session.country} a ${country}` }] },
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
      metadata: { reason, country, mode: this.mode, revoked: this.mode === 'enforce' },
    });
    return this.mode === 'enforce' ? 'revoke' : 'ok';
  }

  /**
   * Un codigo de segundo factor fallo en un inicio de sesion ALTO. A los N fallos recientes: se bloquea la cuenta,
   * queda auditado y se cuenta contra el escudo `account-takeover-attempt` (que bloquea la IP en `enforce`).
   */
  async stepUpFailed(user: Pick<User, 'id'>, context: RequestContext): Promise<void> {
    const { maxFailures, windowMinutes, lockMinutes } = RISK_POLICY.stepUp;
    await this.audit.log({ action: 'risk.stepup.failed', userId: user.id, ip: context.ip, userAgent: context.userAgent });

    const failures = await this.prisma.auditLog.count({
      where: { userId: user.id, action: 'risk.stepup.failed', createdAt: { gte: new Date(Date.now() - windowMinutes * MINUTE_MS) } },
    });
    if (failures < maxFailures) return;

    await this.prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() + lockMinutes * MINUTE_MS) } });
    await this.audit.log({
      action: 'risk.account.locked',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { failures, lockMinutes },
    });
    // Solo la IP: pasar el userId bloquearia a la VICTIMA, no al atacante.
    await this.threats.report('account-takeover-attempt', { ip: context.ip });
  }

  /** Mapa del sistema para el panel admin: modo, puntos, umbrales y senales. */
  describe() {
    return {
      mode: this.mode,
      thresholds: { mediumFrom: RISK_POLICY.mediumFrom, highFrom: RISK_POLICY.highFrom },
      points: RISK_POLICY.points,
      travelWindowHours: RISK_POLICY.travelWindowHours,
      failures: RISK_POLICY.failures,
      device: RISK_POLICY.device,
      stepUp: RISK_POLICY.stepUp,
      signals: SIGNALS.map(({ id, description }) => ({ id, description })),
    };
  }

  private metadata(verdict: RiskVerdict, context: RequestContext, extra: Record<string, unknown>) {
    const { assessment, device, country } = verdict;
    return {
      level: assessment.level,
      score: assessment.score,
      mode: assessment.mode,
      reasons: assessment.reasons,
      country,
      device: device?.label ?? deviceLabel(context.userAgent),
      ...extra,
    };
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
