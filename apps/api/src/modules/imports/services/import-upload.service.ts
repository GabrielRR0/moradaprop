import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { detectSpreadsheet, isSafeZip } from '../../../common/files';
import { PrismaService } from '../../../common/prisma';
import type { AuthUser, RequestContext } from '../../../common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '../../../common/storage';
import { AuditService } from '../../audit';
import { PropertyPolicyService } from '../../properties';
import { ThreatModelService } from '../../security';
import { ImportProcessorService } from './import-processor.service';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

@Injectable()
export class ImportUploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly processor: ImportProcessorService,
    private readonly audit: AuditService,
    private readonly threats: ThreatModelService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /**
   * Valida el archivo (tamano, tipo REAL por magic bytes, sin macros ni zip bombs), lo guarda en el bucket
   * PRIVADO y procesa la importacion. La agencia sale de la cuenta del token.
   */
  async upload(user: AuthUser, file: Express.Multer.File | undefined, context: RequestContext) {
    if (!file) throw new BadRequestException('Envia la planilla en el campo "file"');
    if (file.size > MAX_IMPORT_BYTES) throw new BadRequestException('La planilla supera el maximo de 5 MB');

    await this.threats.inspectFiles([{ buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype }], {
      userId: user.id,
      ip: context.ip,
      roles: user.roles,
    });
    const kind = detectSpreadsheet(file.buffer);
    if (!kind) throw new BadRequestException('Formato no permitido: usa .xlsx o .csv (sin macros)');
    if (kind === 'xlsx' && !isSafeZip(file.buffer)) {
      throw new BadRequestException('La planilla es invalida o demasiado grande al descomprimirse');
    }

    const member = await this.policy.membership(user.id);
    if (!member) throw new ForbiddenException('Solo las agencias pueden importar propiedades');
    const agency = await this.prisma.agencyProfile.findUniqueOrThrow({ where: { id: member.agencyId } });

    const day = new Date().toISOString().slice(0, 10);
    const fileKey = `imports/${agency.id}/${day}/${randomUUID()}.${kind}`;
    await this.storage.put('private', fileKey, file.buffer, kind === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');

    const job = await this.prisma.importJob.create({
      data: { userId: user.id, agencyId: agency.id, fileKey, status: 'PROCESANDO' },
    });
    const result = await this.processor.process(job.id, file.buffer, kind, { userId: user.id, member: { ...member, agency } });

    await this.audit.log({
      action: 'imports.completed',
      userId: user.id,
      resource: 'ImportJob',
      resourceId: job.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { total: result.totalRows, imported: result.importedRows, failed: result.failedRows },
    });
    return result;
  }
}
