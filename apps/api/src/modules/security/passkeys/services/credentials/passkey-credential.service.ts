import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { PASSKEY_POLICY } from '../../policy';
import type { VerifiedRegistration } from '../../webauthn/types';
import { DbSupport } from '@/support/db';

const active = { revokedAt: null } as const;

/** Almacen de passkeys: solo guarda la clave PUBLICA y el contador de cada una. */
@Injectable()
export class PasskeyCredentialService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const rows = await this.prisma.passkeyCredential.findMany({ where: { userId, ...active }, orderBy: { createdAt: 'asc' } });
    return rows.map((p) => ({
      id: p.id,
      label: p.label,
      backedUp: p.backedUp,
      transports: p.transports,
      createdAt: p.createdAt,
      lastUsedAt: p.lastUsedAt,
    }));
  }

  count(userId: string): Promise<number> {
    return this.prisma.passkeyCredential.count({ where: { userId, ...active } });
  }

  async credentialIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.passkeyCredential.findMany({ where: { userId, ...active }, select: { credentialId: true } });
    return rows.map((r) => r.credentialId);
  }

  findActive(credentialId: string): Promise<DbSupport.PasskeyCredential | null> {
    return this.prisma.passkeyCredential.findFirst({ where: { credentialId, ...active } });
  }

  /** Guarda una passkey ya verificada. El id de credencial es unico: registrar dos veces la misma da P2002. */
  create(userId: string, verified: VerifiedRegistration, label: string) {
    return this.prisma.passkeyCredential.create({
      data: {
        userId,
        credentialId: verified.credentialId,
        publicKey: verified.publicKey.toString('base64url'),
        algorithm: verified.algorithm,
        signCount: BigInt(verified.signCount),
        transports: verified.transports,
        label: label.trim().slice(0, PASSKEY_POLICY.labelMaxLength) || PASSKEY_POLICY.defaultLabel,
        backedUp: verified.backedUp,
      },
    });
  }

  /** Solo el dueño: una passkey ajena responde como si no existiera (count 0). */
  async rename(userId: string, id: string, label: string): Promise<boolean> {
    const clean = label.trim().slice(0, PASSKEY_POLICY.labelMaxLength);
    const { count } = await this.prisma.passkeyCredential.updateMany({ where: { id, userId, ...active }, data: { label: clean || PASSKEY_POLICY.defaultLabel } });
    return count > 0;
  }

  async revoke(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.passkeyCredential.updateMany({ where: { id, userId, ...active }, data: { revokedAt: new Date() } });
    return count > 0;
  }

  /** Anota el uso: contador nuevo y bandera de respaldo (una passkey puede pasar a sincronizarse). */
  async recordUse(id: string, signCount: number, backedUp: boolean): Promise<void> {
    await this.prisma.passkeyCredential.update({ where: { id }, data: { signCount: BigInt(signCount), backedUp, lastUsedAt: new Date() } });
  }

  /** Contador que retrocede = posible clon: la passkey deja de servir. */
  async revokeById(id: string): Promise<void> {
    await this.prisma.passkeyCredential.updateMany({ where: { id, ...active }, data: { revokedAt: new Date() } });
  }
}
