import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import { PropertyPolicyService } from '@/modules/properties';
import type { ImportJobListResource, ImportJobResource } from '../../contracts/resources';
import { toImportJob } from '../../utils/import-mapper';

const summary = {
  id: true,
  status: true,
  totalRows: true,
  importedRows: true,
  failedRows: true,
  createdAt: true,
  finishedAt: true,
} as const;

@Injectable()
export class ImportQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
  ) {}

  /** Importaciones de MI agencia (la agencia sale de la cuenta, no de la URL). */
  async list(user: AuthUserContext, page = 1, limit = 20): Promise<ImportJobListResource> {
    const where = await this.scope(user);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.importJob.findMany({ where, select: summary, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.importJob.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  /** Detalle con los errores fila por fila. Una importacion de otra agencia no existe para ti. */
  async detail(user: AuthUserContext, id: string): Promise<ImportJobResource> {
    const job = await this.prisma.importJob.findFirst({
      where: { id, ...(await this.scope(user)) },
      select: { ...summary, errors: true },
    });
    if (!job) throw new NotFoundException('Importacion no encontrada');
    return toImportJob(job);
  }

  private async scope(user: AuthUserContext) {
    const member = await this.policy.membership(user.id);
    // Un agente solo ve las que hizo el mismo; el administrador, todas las de la agencia.
    return member?.role === 'AGENCY_ADMIN' ? { agencyId: member.agencyId } : { userId: user.id };
  }
}
