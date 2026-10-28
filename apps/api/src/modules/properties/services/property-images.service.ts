import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';
import { ImagesSupport } from '../../../support/images';
import type { AuthUser, RequestContext } from '../../../common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '../../../common/storage';
import { AuditService } from '../../audit';
import { ThreatModelService } from '../../security';
import { PropertyWriteService } from './property-write.service';

export const MAX_IMAGES_PER_PROPERTY = 20;

/**
 * Orden de carpetas en el almacenamiento:
 *   properties/{propertyId}/original/{uuid}.jpg   (bucket privado)
 *   properties/{propertyId}/thumb|medium|hd/{uuid}.webp   (bucket publico)
 * Los nombres son UUID nuevos: jamas se usa el nombre que mando el usuario.
 */
@Injectable()
export class PropertyImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: ImagesSupport.Service,
    private readonly writer: PropertyWriteService,
    private readonly audit: AuditService,
    private readonly threats: ThreatModelService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async upload(user: AuthUser, propertyId: string, files: Express.Multer.File[], context: RequestContext) {
    await this.writer.findManaged(user, propertyId, context);
    if (!files?.length) throw new BadRequestException('Envia al menos una imagen en el campo "files"');
    await this.threats.inspectFiles(
      files.map((f) => ({ buffer: f.buffer, filename: f.originalname, mimetype: f.mimetype })),
      { userId: user.id, ip: context.ip, roles: user.roles },
    );

    const existing = await this.prisma.propertyImage.count({ where: { propertyId } });
    if (existing + files.length > MAX_IMAGES_PER_PROPERTY) {
      throw new ConflictException(`Maximo ${MAX_IMAGES_PER_PROPERTY} imagenes por propiedad`);
    }

    // Se procesan TODAS antes de guardar nada: si una es invalida no queda nada a medias.
    const processed = await Promise.all(files.map((file) => this.images.process(file.buffer)));

    const hasCover = (await this.prisma.propertyImage.count({ where: { propertyId, isCover: true } })) > 0;
    const written: Array<{ bucket: 'public' | 'private'; key: string }> = [];
    try {
      const rows = [];
      for (const [index, image] of processed.entries()) {
        const id = randomUUID();
        const base = `properties/${propertyId}`;
        const keys = {
          originalKey: `${base}/original/${id}.jpg`,
          thumbKey: `${base}/thumb/${id}.webp`,
          mediumKey: `${base}/medium/${id}.webp`,
          hdKey: `${base}/hd/${id}.webp`,
        };
        await this.put('private', keys.originalKey, image.original, 'image/jpeg', written);
        await this.put('public', keys.thumbKey, image.thumb, 'image/webp', written);
        await this.put('public', keys.mediumKey, image.medium, 'image/webp', written);
        await this.put('public', keys.hdKey, image.hd, 'image/webp', written);
        rows.push({ propertyId, ...keys, position: existing + index, isCover: !hasCover && index === 0 });
      }
      await this.prisma.propertyImage.createMany({ data: rows });
    } catch (error) {
      // Algo fallo a mitad: se borra lo ya subido para no dejar archivos huerfanos.
      await Promise.all([
        this.storage.delete('private', written.filter((w) => w.bucket === 'private').map((w) => w.key)),
        this.storage.delete('public', written.filter((w) => w.bucket === 'public').map((w) => w.key)),
      ]).catch(() => undefined);
      throw error;
    }

    await this.audit.log({
      action: 'properties.images.uploaded',
      userId: user.id,
      resource: 'Property',
      resourceId: propertyId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { count: files.length },
    });
    return { uploaded: files.length, total: existing + files.length };
  }

  async remove(user: AuthUser, propertyId: string, imageId: string, context: RequestContext) {
    await this.writer.findManaged(user, propertyId);
    const image = await this.prisma.propertyImage.findFirst({ where: { id: imageId, propertyId } });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.prisma.propertyImage.delete({ where: { id: imageId } });
    await this.storage.delete('private', [image.originalKey]);
    await this.storage.delete('public', [image.thumbKey, image.mediumKey, image.hdKey]);

    if (image.isCover) {
      const next = await this.prisma.propertyImage.findFirst({ where: { propertyId }, orderBy: { position: 'asc' } });
      if (next) await this.prisma.propertyImage.update({ where: { id: next.id }, data: { isCover: true } });
    }
    await this.audit.log({
      action: 'properties.images.deleted',
      userId: user.id,
      resource: 'Property',
      resourceId: propertyId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { imageId },
    });
  }

  async setCover(user: AuthUser, propertyId: string, imageId: string) {
    await this.writer.findManaged(user, propertyId);
    const image = await this.prisma.propertyImage.findFirst({ where: { id: imageId, propertyId } });
    if (!image) throw new NotFoundException('Imagen no encontrada');

    await this.prisma.$transaction([
      this.prisma.propertyImage.updateMany({ where: { propertyId }, data: { isCover: false } }),
      this.prisma.propertyImage.update({ where: { id: imageId }, data: { isCover: true } }),
    ]);
    return { coverImageId: imageId };
  }

  private async put(
    bucket: 'public' | 'private',
    key: string,
    data: Buffer,
    contentType: string,
    written: Array<{ bucket: 'public' | 'private'; key: string }>,
  ) {
    await this.storage.put(bucket, key, data, contentType);
    written.push({ bucket, key });
  }
}
