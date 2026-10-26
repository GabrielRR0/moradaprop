import { Injectable } from '@nestjs/common';
import { AuditService } from '../../../audit';

const EVENT_TITLES: Record<string, string> = {
  'risk.assessed': 'Inicio de sesion distinto al habitual',
  'risk.stepup.passed': 'Inicio de sesion verificado con segundo factor',
  'risk.denied': 'Intento de entrada bloqueado',
  'risk.stepup.failed': 'Segundo factor fallido',
  'risk.account.locked': 'Cuenta bloqueada temporalmente',
  'risk.session.revoked': 'Sesion cerrada por seguridad',
  'risk.factor.denied': 'Cambio de verificacion bloqueado',
  'risk.passkey.registered': 'Passkey agregada',
  'risk.passkey.revoked': 'Passkey quitada',
  'risk.passkey.cloned': 'Passkey desactivada: posible copia',
  'risk.device.confirmed': 'Dispositivo confirmado',
  'risk.device.revoked': 'Dispositivo quitado',
};

/** Historial de seguridad del propio usuario (lo que reemplaza al aviso por correo): que paso, cuando, desde que pais y dispositivo. */
@Injectable()
export class SecurityEventsService {
  constructor(private readonly audit: AuditService) {}

  async list(userId: string) {
    const events = await this.audit.recentForUser(userId, 'risk.', 30);
    return events.map(({ id, action, createdAt, metadata }) => ({
      id,
      at: createdAt,
      type: action,
      title: EVENT_TITLES[action] ?? action,
      level: (metadata?.level as string | undefined) ?? null,
      country: (metadata?.country as string | undefined) ?? null,
      device: (metadata?.device as string | undefined) ?? null,
      details: ((metadata?.reasons as Array<{ reason: string }> | undefined) ?? []).map((r) => r.reason),
    }));
  }
}
