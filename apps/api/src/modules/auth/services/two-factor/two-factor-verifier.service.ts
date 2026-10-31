import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig } from '@/config';
import { CryptoService } from '@/common/crypto';
import { PrismaService } from '@/common/prisma';
import { FieldCipher } from '@/modules/security';
import { DbSupport } from '@/support/db';
import { TotpSupport } from '@/support/totp';
import { VerificationCodeService } from '../registration/verification-code.service';

const INVALID_CODE = 'Codigo invalido';
const BACKUP_CODE = /^[a-z0-9]{5}-[a-z0-9]{5}$/;

/** Comprueba los codigos del segundo factor (app autenticadora, respaldo, correo) y crea los codigos de respaldo. */
@Injectable()
export class TwoFactorVerifier {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly codes: VerificationCodeService,
    private readonly cipher: FieldCipher,
    private readonly config: AppConfig,
  ) {}

  /** TOTP, o codigo de respaldo; durante el login tambien el codigo enviado por correo. */
  async verifyAnyCode(user: DbSupport.User, code: string, allowEmail = false) {
    const clean = code.trim().toLowerCase();

    if (/^\d{6}$/.test(clean)) {
      if (allowEmail && (await this.tryEmailCode(user.id, clean))) return;
      return this.verifyTotp(user, clean);
    }
    if (BACKUP_CODE.test(clean)) return this.consumeBackupCode(user.id, clean);
    throw new UnauthorizedException(INVALID_CODE);
  }

  /** Valida un TOTP (tolerancia de +-30s) y rechaza reusar el mismo paso de tiempo. */
  async verifyTotp(user: DbSupport.User, code: string) {
    if (!user.twoFactorSecret) throw new UnauthorizedException(INVALID_CODE);

    // delta: 0 = paso actual, -1 = anterior, 1 = siguiente; null = codigo incorrecto.
    const delta = TotpSupport.check(code, this.cipher.decrypt('User.twoFactorSecret', user.twoFactorSecret));
    if (delta === null) throw new UnauthorizedException(INVALID_CODE);

    // Anti-replay: un paso de tiempo ya aceptado no se puede volver a usar.
    const step = Math.floor(Date.now() / 1000 / TotpSupport.PERIOD_SECONDS) + delta;
    if (user.twoFactorLastStep !== null && step <= user.twoFactorLastStep) {
      throw new UnauthorizedException(INVALID_CODE);
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorLastStep: step } });
  }

  /** Genera codigos de respaldo nuevos y borra los anteriores. Devuelve los codigos en claro (se muestran una sola vez). */
  async createBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: this.config.auth.backupCodesCount }, () => {
      const raw = this.crypto.randomToken(8).replace(/[^a-z0-9]/gi, '').toLowerCase().padEnd(10, '0');
      return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
    });
    await this.prisma.$transaction([
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
      this.prisma.twoFactorBackupCode.createMany({
        data: codes.map((code) => ({ userId, codeHash: this.crypto.hashCode(code, `${userId}:backup`) })),
      }),
    ]);
    return codes;
  }

  private async tryEmailCode(userId: string, code: string): Promise<boolean> {
    try {
      await this.codes.consume(userId, 'TWO_FACTOR_EMAIL', code);
      return true;
    } catch {
      return false;
    }
  }

  private async consumeBackupCode(userId: string, code: string) {
    const hash = this.crypto.hashCode(code, `${userId}:backup`);
    const { count } = await this.prisma.twoFactorBackupCode.updateMany({
      where: { userId, codeHash: hash, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count !== 1) throw new UnauthorizedException(INVALID_CODE);
  }
}
