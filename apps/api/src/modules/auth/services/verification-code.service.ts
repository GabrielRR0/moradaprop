import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma, VerificationType } from '@prisma/client';
import { AppConfig } from '../../../config';
import { CryptoService } from '../../../common/crypto';
import { PrismaService } from '../../../common/prisma';

const INVALID_CODE = 'Codigo invalido o vencido';

/** Codigos numericos de un solo uso (correo, reset, 2FA por correo, vincular Google). */
@Injectable()
export class VerificationCodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: AppConfig,
  ) {}

  /**
   * Crea un codigo nuevo e invalida los anteriores del mismo tipo.
   * Respeta el cooldown de reenvio (429 si se pide demasiado pronto).
   */
  async issue(userId: string, type: VerificationType, payload?: Prisma.InputJsonValue): Promise<string> {
    const { codeLength, codeTtlMinutes, resendCooldownSeconds } = this.config.auth;

    const last = await this.prisma.verificationCode.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < resendCooldownSeconds * 1000) {
      throw new HttpException(
        `Espera ${resendCooldownSeconds} segundos antes de pedir otro codigo`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.crypto.numericCode(codeLength);
    await this.prisma.$transaction([
      this.prisma.verificationCode.deleteMany({ where: { userId, type } }),
      this.prisma.verificationCode.create({
        data: {
          userId,
          type,
          payload,
          codeHash: this.crypto.hashCode(code, `${userId}:${type}`),
          expiresAt: new Date(Date.now() + codeTtlMinutes * 60_000),
        },
      }),
    ]);
    return code;
  }

  /** Valida el codigo (un solo uso, intentos limitados). Devuelve el payload guardado. */
  async consume(userId: string, type: VerificationType, code: string): Promise<Prisma.JsonValue | null> {
    const record = await this.prisma.verificationCode.findFirst({
      where: { userId, type, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new BadRequestException(INVALID_CODE);

    if (record.attempts >= this.config.auth.maxCodeAttempts) {
      await this.prisma.verificationCode.delete({ where: { id: record.id } });
      throw new BadRequestException(INVALID_CODE);
    }

    const expected = this.crypto.hashCode(code, `${userId}:${type}`);
    if (!this.crypto.safeEqual(expected, record.codeHash)) {
      await this.prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException(INVALID_CODE);
    }

    await this.prisma.verificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return record.payload;
  }

  get ttlMinutes(): number {
    return this.config.auth.codeTtlMinutes;
  }
}
