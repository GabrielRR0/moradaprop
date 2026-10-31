import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { SocialAccountVault, UserVault } from '@/modules/security';
import type { UpdateProfileDto } from '../contracts/dto/update-profile.dto';
import type { UserProfileResource } from '../contracts/resources';
import { DbSupport } from '@/support/db';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly vault: UserVault,
    private readonly social: SocialAccountVault,
  ) {}

  /** Perfil del usuario del token, con sus agencias y proveedores vinculados. Sin hashes ni secretos. */
  async me(userId: string): Promise<UserProfileResource> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        roles: true,
        emailVerifiedAt: true,
        twoFactorEnabled: true,
        passwordHash: true,
        createdAt: true,
        socialAccounts: { select: { provider: true, email: true } },
        agencyMembers: {
          where: { invitationStatus: 'ACCEPTED' },
          select: { role: true, agency: { select: { id: true, name: true, logoUrl: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const { passwordHash, emailVerifiedAt, ...rest } = this.vault.decode(user);
    rest.socialAccounts = rest.socialAccounts.map((account) => this.social.decode(account));
    return { ...rest, emailVerified: Boolean(emailVerifiedAt), hasPassword: Boolean(passwordHash) };
  }

  async update(userId: string, dto: UpdateProfileDto, context: RequestContext): Promise<UserProfileResource> {
    const current = this.vault.decode(await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }));
    await this.prisma.user.update({
      where: { id: userId },
      data: this.vault.encode({ email: current.email, name: dto.name ?? current.name, phone: dto.phone }),
    });
    await this.audit.log({
      action: 'users.profile.updated',
      userId,
      resource: 'User',
      resourceId: userId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { fields: Object.keys(dto) },
    });
    return this.me(userId);
  }

  /** Un cliente pasa a poder publicar propiedades como dueno directo. */
  async becomeOwner(userId: string, context: RequestContext): Promise<UserProfileResource> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.roles.includes(DbSupport.Role.OWNER)) throw new ConflictException('Ya eres dueno directo');

    await this.prisma.user.update({ where: { id: userId }, data: { roles: { set: [...user.roles, DbSupport.Role.OWNER] } } });
    await this.audit.log({
      action: 'users.role.owner-added',
      userId,
      resource: 'User',
      resourceId: userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return this.me(userId);
  }
}
