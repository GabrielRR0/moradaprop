import { Injectable } from '@nestjs/common';
import { CryptoService } from '@/common/crypto';
import { PrismaService } from '@/common/prisma';
import { AuditService } from '@/modules/audit';
import { RISK_POLICY } from '../../policy';
import type { KnownDevice } from '../../types';
import { deviceLabel } from '../../utils/device-label';

const DAY_MS = 24 * 60 * 60 * 1000;
const newExpiry = () => new Date(Date.now() + RISK_POLICY.device.ttlDays * DAY_MS);

/**
 * Registro de dispositivos EN LA BASE DE DATOS (como Google o GitHub). El navegador o la app guarda un secreto
 * aleatorio; aqui solo vive su hash. Sin el secreto la fila no sirve, y borrar la fila invalida el secreto
 * aunque siga en el navegador. Solo un dispositivo CONFIRMADO (verificado con segundo factor, o la primera
 * entrada de la cuenta) resta riesgo.
 */
@Injectable()
export class DeviceRegistryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly audit: AuditService,
  ) {}

  /** El dispositivo que presenta el cliente, si es valido, de ESTE usuario y no ha vencido ni se revoco. */
  async find(userId: string, rawToken: string | undefined): Promise<KnownDevice | null> {
    if (!rawToken) return null;
    const device = await this.prisma.trustedDevice.findFirst({
      where: { secretHash: this.crypto.hashToken(rawToken), userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    return device ? { id: device.id, label: device.label, confirmed: device.confirmedAt !== null } : null;
  }

  /** Registra un dispositivo nuevo y devuelve su secreto en claro (la unica vez que existe fuera del cliente). */
  async register(
    userId: string,
    input: { userAgent?: string; country: string | null; confirmed: boolean },
  ): Promise<{ id: string; secret: string; label: string }> {
    const secret = this.crypto.randomToken(32);
    const device = await this.prisma.trustedDevice.create({
      data: {
        userId,
        secretHash: this.crypto.hashToken(secret),
        label: deviceLabel(input.userAgent),
        confirmedAt: input.confirmed ? new Date() : null,
        lastCountry: input.country,
        expiresAt: newExpiry(),
      },
    });
    await this.trim(userId);
    return { id: device.id, secret, label: device.label };
  }

  async confirm(deviceId: string): Promise<void> {
    await this.prisma.trustedDevice.updateMany({ where: { id: deviceId, confirmedAt: null }, data: { confirmedAt: new Date() } });
  }

  /** Renueva el vencimiento deslizante y anota el ultimo pais. */
  async touch(deviceId: string, country: string | null): Promise<void> {
    await this.prisma.trustedDevice.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date(), expiresAt: newExpiry(), ...(country ? { lastCountry: country } : {}) },
    });
  }

  async list(userId: string) {
    const rows = await this.prisma.trustedDevice.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    });
    return rows.map((d) => ({
      id: d.id,
      label: d.label,
      confirmed: d.confirmedAt !== null,
      firstSeenAt: d.firstSeenAt,
      lastSeenAt: d.lastSeenAt,
      lastCountry: d.lastCountry,
    }));
  }

  /** El usuario quita un dispositivo suyo: deja de ser de confianza y se cierran las sesiones abiertas desde el. */
  async revoke(userId: string, deviceId: string, ip?: string): Promise<boolean> {
    const now = new Date();
    const { count } = await this.prisma.trustedDevice.updateMany({
      where: { id: deviceId, userId, revokedAt: null },
      data: { revokedAt: now },
    });
    if (count === 0) return false;
    await this.prisma.session.updateMany({ where: { deviceId, revokedAt: null }, data: { revokedAt: now } });
    await this.audit.log({ action: 'risk.device.revoked', userId, resource: 'TrustedDevice', resourceId: deviceId, ip });
    return true;
  }

  /** Pasado el maximo por usuario se retiran primero los no confirmados y, entre iguales, los menos usados. */
  private async trim(userId: string): Promise<void> {
    const where = { userId, revokedAt: null, expiresAt: { gt: new Date() } };
    const excess = (await this.prisma.trustedDevice.count({ where })) - RISK_POLICY.device.maxPerUser;
    if (excess <= 0) return;
    const oldest = await this.prisma.trustedDevice.findMany({
      where,
      orderBy: [{ confirmedAt: { sort: 'asc', nulls: 'first' } }, { lastSeenAt: 'asc' }],
      take: excess,
      select: { id: true },
    });
    await this.prisma.trustedDevice.updateMany({ where: { id: { in: oldest.map((d) => d.id) } }, data: { revokedAt: new Date() } });
  }
}
