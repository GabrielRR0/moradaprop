import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';

/** Pertenencia a una agencia: de aqui salen todos los permisos del modulo. */
@Injectable()
export class AgencyAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Membresia aceptada del usuario (la agencia sale de su cuenta, nunca de la URL). */
  async requireMember(userId: string) {
    const member = await this.prisma.agencyMember.findFirst({
      where: { userId, invitationStatus: 'ACCEPTED' },
      include: { agency: true },
    });
    if (!member) throw new ForbiddenException('No perteneces a ninguna agencia');
    return member;
  }

  async requireAdmin(userId: string) {
    const member = await this.requireMember(userId);
    if (member.role !== 'AGENCY_ADMIN') {
      throw new ForbiddenException('Solo el administrador de la agencia puede hacer esto');
    }
    return member;
  }
}
