import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma';
import { verifyPassword } from '../../../../common/password';
import type { RequestContext } from '../../../../common/security/types';
import { AccessRiskService } from '../../access-risk';
import { UserVault } from '../../encryption';
import type { FinishRegistrationDto } from '../dto/passkey.dto';
import { PasskeyService } from './passkey.service';

/**
 * Agregar, renombrar y quitar passkeys de la PROPIA cuenta (el usuario siempre sale del token).
 * Agregar o quitar un metodo de verificacion es lo mas delicado de una cuenta: si un atacante con la clave pudiera
 * registrar SU passkey, dejaria fuera al dueño. Por eso se exige (1) un dispositivo ya confirmado y (2) la contrasena otra vez.
 */
@Injectable()
export class PasskeyEnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: UserVault,
    private readonly passkeys: PasskeyService,
    private readonly risk: AccessRiskService,
  ) {}

  async start(userId: string, password: string | undefined, context: RequestContext) {
    await this.risk.assertTrustedContext({ id: userId }, context);
    const user = this.vault.decode(await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }));
    // Cuenta creada solo con Google: no tiene contrasena que pedir (el dispositivo confirmado es la barrera).
    if (user.passwordHash && (!password || !(await verifyPassword(user.passwordHash, password)))) {
      throw new ForbiddenException('Contrasena incorrecta');
    }
    return this.passkeys.registrationOptions({ id: user.id, email: user.email, name: user.name });
  }

  async finish(userId: string, dto: FinishRegistrationDto, context: RequestContext) {
    await this.risk.assertTrustedContext({ id: userId }, context);
    return this.passkeys.verifyRegistration({ id: userId }, dto.credential, dto.label, context);
  }

  list(userId: string) {
    return this.passkeys.list(userId).then((items) => ({ items }));
  }

  async rename(userId: string, id: string, label: string) {
    if (!(await this.passkeys.rename(userId, id, label))) throw new NotFoundException('Passkey no encontrada');
    return { id, label: label.trim() };
  }

  /** Una passkey ajena responde 404, como si no existiera. */
  async remove(userId: string, id: string, context: RequestContext) {
    await this.risk.assertTrustedContext({ id: userId }, context);
    if (!(await this.passkeys.revoke(userId, id, context))) throw new NotFoundException('Passkey no encontrada');
  }
}
