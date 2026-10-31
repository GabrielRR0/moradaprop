import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '@/config';
import type { RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { DbSupport } from '@/support/db';
import type { AccessRiskOverviewResource } from '../contracts/resources';
import { RISK_POLICY } from '../policy';
import { SIGNALS } from '../signals';
import type { LoginTrust, RiskMode, RiskVerdict, SessionRef } from '../types';
import { deviceLabel } from '../utils/device-label';
import { riskMetadata } from '../utils/risk-metadata';
import { RiskAssessorService } from './assessment/risk-assessor.service';
import { DeviceRegistryService } from './devices/device-registry.service';
import { LoginTrustService } from './login/login-trust.service';
import { RefreshGuardService } from './login/refresh-guard.service';
import { StepUpService } from './login/step-up.service';

/**
 * Fachada del riesgo de inicio de sesion: lo UNICO que `auth` usa. Mide cada inicio de sesion (pais, red,
 * dispositivo), decide si hay que pedir segundo factor, recuerda lo habitual y vigila la renovacion de sesiones.
 * El trabajo pesado esta en `login/` (aprender, vigilar el refresh, fallos del segundo factor) y `assessment/`.
 */
@Injectable()
export class AccessRiskService implements OnModuleInit {
  private readonly logger = new Logger(AccessRiskService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly audit: AuditService,
    private readonly assessor: RiskAssessorService,
    private readonly devices: DeviceRegistryService,
    private readonly trust: LoginTrustService,
    private readonly refreshGuard: RefreshGuardService,
    private readonly stepUp: StepUpService,
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
  assess(user: Pick<DbSupport.User, 'id'>, context: RequestContext): Promise<RiskVerdict> {
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
  async assertTrustedContext(user: Pick<DbSupport.User, 'id'>, context: RequestContext): Promise<void> {
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
  async assertCanProceed(user: Pick<DbSupport.User, 'id'>, verdict: RiskVerdict, hasSecondFactor: boolean, context: RequestContext) {
    if (!this.requiresStrongFactor(verdict) || hasSecondFactor) return;
    await this.audit.log({
      action: 'risk.denied',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: riskMetadata(verdict, context, { outcome: 'denied' }),
    });
    throw new ForbiddenException({
      message: 'Por seguridad, entra desde tu dispositivo habitual y activa passkey o verificacion en dos pasos para poder entrar desde otros lugares',
      code: 'SECOND_FACTOR_REQUIRED',
    });
  }

  /** El inicio de sesion se completo: registra el dispositivo, recuerda pais y red y deja constancia (ver login/login-trust). */
  onLoginSuccess(user: Pick<DbSupport.User, 'id'>, context: RequestContext, verdict: RiskVerdict, factorVerified: boolean): Promise<LoginTrust> {
    return this.trust.onLoginSuccess(user, context, verdict, factorVerified);
  }

  /** Renovacion de sesion: ¿sigue siendo el mismo dispositivo? Si no, se revoca (ver login/refresh-guard). */
  checkRefresh(session: SessionRef, context: RequestContext): Promise<'ok' | 'revoke'> {
    return this.refreshGuard.checkRefresh(session, context);
  }

  /** Un codigo de segundo factor fallo en un inicio ALTO; a los N fallos se bloquea la cuenta (ver login/step-up). */
  stepUpFailed(user: Pick<DbSupport.User, 'id'>, context: RequestContext): Promise<void> {
    return this.stepUp.stepUpFailed(user, context);
  }

  /** Mapa del sistema para el panel admin: modo, puntos, umbrales y senales. */
  describe(): AccessRiskOverviewResource {
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
}
