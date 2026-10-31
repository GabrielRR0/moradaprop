import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { mapSheet } from '../../utils/row-mapper';
import { readSheet } from '../../utils/sheet-reader';
import { DbSupport } from '@/support/db';

const MAX_REPORTED_ERRORS = 200;

export interface ImportOwner {
  userId: string;
  member: DbSupport.AgencyMember & { agency: DbSupport.AgencyProfile };
}

/**
 * Convierte una planilla en propiedades. Solo depende de (jobId, archivo, quien importa):
 * hoy lo llama la peticion; cuando exista la cola de trabajos (BullMQ) la llamara un job sin cambios.
 */
@Injectable()
export class ImportProcessorService {
  constructor(private readonly prisma: PrismaService) {}

  async process(jobId: string, file: Buffer, kind: 'xlsx' | 'csv', owner: ImportOwner) {
    try {
      const table = await readSheet(file, kind);
      if (table.length < 2) throw new BadRequestException('La planilla no tiene filas de datos');

      const sheet = await mapSheet(table);
      if (sheet.missingHeaders.length > 0) {
        throw new BadRequestException(`Faltan columnas obligatorias: ${sheet.missingHeaders.join(', ')}`);
      }

      const valid = sheet.rows.filter((r) => r.data);
      const failed = sheet.rows.filter((r) => !r.data);
      await this.assertRoom(owner.member, valid.length);

      const { agencyId } = owner.member;
      const assignedAgentId = owner.member.role === 'AGENT' ? owner.userId : null;
      const now = new Date();
      // Insercion por lotes: una sola sentencia para todas las filas validas.
      await this.prisma.property.createMany({
        data: valid.map(({ data }) => ({
          ...(data as DbSupport.Prisma.PropertyCreateManyInput),
          ownerUserId: owner.userId,
          agencyId,
          assignedAgentId,
          importJobId: jobId,
          status: 'PUBLICADA' as const,
          publishedAt: now,
        })),
      });

      return this.finish(jobId, {
        status: 'COMPLETADA',
        totalRows: sheet.rows.length,
        importedRows: valid.length,
        failedRows: failed.length,
        errors: [
          ...failed.slice(0, MAX_REPORTED_ERRORS).map(({ row, errors }) => ({ row, errors })),
          ...(sheet.ignoredHeaders.length > 0 ? [{ row: 1, errors: [`Columnas ignoradas: ${sheet.ignoredHeaders.join(', ')}`] }] : []),
        ],
      });
    } catch (error) {
      // El trabajo queda registrado como FALLIDO con el motivo, y el error llega al usuario.
      await this.finish(jobId, {
        status: 'FALLIDA',
        totalRows: 0,
        importedRows: 0,
        failedRows: 0,
        errors: [{ row: 0, errors: [error instanceof Error ? error.message : 'Error desconocido'] }],
      });
      throw error;
    }
  }

  /** Si las filas validas exceden el plan de la agencia, no se importa nada. */
  private async assertRoom(member: ImportOwner['member'], incoming: number) {
    const current = await this.prisma.property.count({ where: { agencyId: member.agencyId } });
    if (current + incoming > member.agency.maxProperties) {
      throw new ConflictException(
        `Tu plan permite ${member.agency.maxProperties} propiedades: tienes ${current} y la planilla agrega ${incoming}`,
      );
    }
  }

  private finish(
    jobId: string,
    data: { status: 'COMPLETADA' | 'FALLIDA'; totalRows: number; importedRows: number; failedRows: number; errors: DbSupport.Prisma.InputJsonValue },
  ) {
    return this.prisma.importJob.update({ where: { id: jobId }, data: { ...data, finishedAt: new Date() } });
  }
}
