import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { CryptoService } from '../../../../common/crypto';
import { PrismaService } from '../../../../common/prisma';
import { PASSKEY_POLICY } from '../policy';
import { WebAuthnError } from '../webauthn/types';
import { DbSupport } from '../../../../support/db';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Desafios de UN SOLO USO. El servidor inventa un valor aleatorio, el autenticador lo firma, y al verificar se
 * comprueba que es uno que emitimos, que no vencio y que no se uso antes (asi una respuesta capturada no se puede
 * repetir). Viven en la base de datos (no en memoria) para que funcione con varios servidores. Solo se guarda su hash.
 */
@Injectable()
export class PasskeyChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** Emite un desafio nuevo (base64url). REGISTER y STEP_UP quedan atados al usuario; LOGIN no (la passkey dice quien es). */
  async issue(kind: DbSupport.PasskeyChallengeKind, userId?: string): Promise<string> {
    const challenge = randomBytes(32).toString('base64url');
    await this.prisma.passkeyChallenge.create({
      data: {
        challengeHash: this.crypto.hashToken(challenge),
        kind,
        userId: userId ?? null,
        expiresAt: new Date(Date.now() + PASSKEY_POLICY.challengeTtlSeconds * 1000),
      },
    });
    // Limpieza barata de los vencidos hace rato (no hace falta un job aparte).
    await this.prisma.passkeyChallenge.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - HOUR_MS) } } });
    return challenge;
  }

  /**
   * Gasta un desafio: debe existir, ser del tipo esperado, estar vigente, sin usar y (si se indica) ser de ese usuario.
   * Es atomico: dos respuestas con el mismo desafio, solo una pasa.
   */
  async consume(challenge: string, kind: DbSupport.PasskeyChallengeKind, userId?: string): Promise<void> {
    const { count } = await this.prisma.passkeyChallenge.updateMany({
      where: {
        challengeHash: this.crypto.hashToken(challenge),
        kind,
        usedAt: null,
        expiresAt: { gt: new Date() },
        ...(userId ? { userId } : {}),
      },
      data: { usedAt: new Date() },
    });
    if (count !== 1) throw new WebAuthnError('bad-challenge', 'desconocido, vencido, usado o de otro usuario');
  }
}
