import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { hashPassword, verifyPassword } from '../../../common/password';
import { PrismaService } from '../../../common/prisma';
import type { RequestContext } from '../../../common/security/types';
import { AuditService } from '../../audit';
import type { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Cambia la contrasena y cierra las DEMAS sesiones (la actual se conserva).
   * Si la cuenta ya tenia contrasena, exige la actual; si era solo-Google, permite definirla.
   */
  async change(userId: string, sessionId: string, dto: ChangePasswordDto, context: RequestContext) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.passwordHash) {
      if (!dto.currentPassword || !(await verifyPassword(user.passwordHash, dto.currentPassword))) {
        throw new ForbiddenException('La contrasena actual es incorrecta');
      }
      if (dto.currentPassword === dto.newPassword) {
        throw new BadRequestException('La contrasena nueva debe ser distinta a la actual');
      }
    }

    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(dto.newPassword) } });
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: { not: sessionId } },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      action: 'users.password.changed',
      userId,
      resource: 'User',
      resourceId: userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return { message: 'Contrasena actualizada' };
  }
}
