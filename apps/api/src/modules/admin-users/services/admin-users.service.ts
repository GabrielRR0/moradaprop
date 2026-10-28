import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';
import type { RequestContext } from '../../../common/security/types';
import { AuditService } from '../../audit';
import { SecurityService, UserVault } from '../../security';
import type { ListUsersQueryDto, SetUserStatusDto } from '../dto/admin-users.dto';
import { DbSupport } from '../../../support/db';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly security: SecurityService,
    private readonly vault: UserVault,
  ) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: DbSupport.Prisma.UserWhereInput = {
      status: query.status,
      ...this.vault.searchWhere(query.q),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          roles: true,
          status: true,
          emailVerifiedAt: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: items.map((item) => this.vault.decode(item)), total, page, limit };
  }

  /** Suspende o reactiva una cuenta. Al suspender se cierran todas sus sesiones. */
  async setStatus(adminId: string, userId: string, dto: SetUserStatusDto, context: RequestContext) {
    if (adminId === userId) throw new BadRequestException('No puedes cambiar el estado de tu propia cuenta');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    await this.prisma.user.update({ where: { id: userId }, data: { status: dto.status } });
    if (dto.status === 'SUSPENDED') {
      await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      // Sin esto, el access token ya emitido seguiria sirviendo hasta 15 min. El bloqueo se evalua en cada peticion.
      await this.security.blockUser(userId, dto.reason ?? 'Cuenta suspendida', adminId);
    } else {
      await this.security.unblockUser(userId);
    }
    await this.audit.log({
      action: dto.status === 'SUSPENDED' ? 'admin.user.suspended' : 'admin.user.reactivated',
      userId: adminId,
      resource: 'User',
      resourceId: userId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { from: user.status, to: dto.status, reason: dto.reason },
    });
    return { id: userId, status: dto.status };
  }
}
