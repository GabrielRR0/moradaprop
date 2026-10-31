import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { AuditService } from '@/modules/audit';
import type { CreatePropertyDto } from '../contracts/dto/create-property.dto';
import type { UpdatePropertyDto } from '../contracts/dto/update-property.dto';
import { OwnershipService } from '@/modules/security';
import { PropertyAccessPolicy } from './property-access.policy';
import { PropertyPolicyService } from './property-policy.service';
import { DbSupport } from '@/support/db';

/** Transiciones permitidas. La reservada puede volver a publicarse si la reserva se cae. */
const TRANSITIONS: Record<DbSupport.PropertyStatus, DbSupport.PropertyStatus[]> = {
  PUBLICADA: ['RESERVADA', 'ALQUILADA', 'PAUSADA'],
  RESERVADA: ['PUBLICADA', 'ALQUILADA', 'PAUSADA'],
  ALQUILADA: ['PUBLICADA', 'PAUSADA'],
  PAUSADA: ['PUBLICADA'],
};

@Injectable()
export class PropertyWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly access: PropertyAccessPolicy,
    private readonly ownership: OwnershipService,
    private readonly audit: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /**
   * El dueno, la agencia y el agente salen del TOKEN, nunca del body.
   * Una agencia publica a nombre de su organizacion; un dueno directo, a nombre propio.
   */
  async create(user: AuthUserContext, dto: CreatePropertyDto, context: RequestContext): Promise<DbSupport.Property> {
    const isAgency = user.roles.includes(DbSupport.Role.AGENCY);
    if (!isAgency && !user.roles.includes(DbSupport.Role.OWNER)) {
      throw new ForbiddenException('Tu cuenta no puede publicar propiedades');
    }

    let agencyId: string | null = null;
    let assignedAgentId: string | null = null;
    if (isAgency) {
      const member = await this.policy.membership(user.id);
      if (!member) throw new ForbiddenException('No perteneces a ninguna agencia');
      await this.assertAgencyHasRoom(member.agencyId);
      agencyId = member.agencyId;
      assignedAgentId = member.role === 'AGENT' ? user.id : null;
    }

    const property = await this.prisma.property.create({
      data: { ...dto, ownerUserId: user.id, agencyId, assignedAgentId, status: 'PUBLICADA', publishedAt: new Date() },
    });
    await this.log('properties.created', user, property.id, context, { agencyId });
    return property;
  }

  async update(user: AuthUserContext, id: string, dto: UpdatePropertyDto, context: RequestContext): Promise<DbSupport.Property> {
    const property = await this.findManaged(user, id, context);
    const updated = await this.prisma.property.update({ where: { id }, data: dto });
    await this.log('properties.updated', user, property.id, context, { fields: Object.keys(dto) });
    return updated;
  }

  async changeStatus(user: AuthUserContext, id: string, status: DbSupport.PropertyStatus, context: RequestContext): Promise<DbSupport.Property> {
    const property = await this.findManaged(user, id, context);
    if (!TRANSITIONS[property.status].includes(status)) {
      throw new BadRequestException(`No se puede pasar de ${property.status} a ${status}`);
    }
    const updated = await this.prisma.property.update({
      where: { id },
      data: { status, publishedAt: status === 'PUBLICADA' ? (property.publishedAt ?? new Date()) : undefined },
    });
    await this.log('properties.status.changed', user, id, context, { from: property.status, to: status });
    return updated;
  }

  async assignAgent(user: AuthUserContext, id: string, agentUserId: string, context: RequestContext): Promise<DbSupport.Property> {
    const property = await this.findProperty(id);
    await this.policy.assertCanAssign(user, property);
    if (!property.agencyId) throw new BadRequestException('Solo las propiedades de una agencia tienen agente');

    const member = await this.policy.membership(agentUserId, property.agencyId);
    if (!member) throw new BadRequestException('Ese usuario no pertenece a la agencia');

    const updated = await this.prisma.property.update({ where: { id }, data: { assignedAgentId: agentUserId } });
    await this.log('properties.agent.assigned', user, id, context, { agentUserId });
    return updated;
  }

  /** Borra la propiedad y todos sus archivos (originales privados y variantes publicas). */
  async remove(user: AuthUserContext, id: string, context: RequestContext): Promise<void> {
    await this.findManaged(user, id, context);
    const images = await this.prisma.propertyImage.findMany({ where: { propertyId: id } });

    await this.prisma.property.delete({ where: { id } });
    await this.storage.delete('private', images.map((i) => i.originalKey));
    await this.storage.delete('public', images.flatMap((i) => [i.thumbKey, i.mediumKey, i.hdKey]));
    await this.log('properties.deleted', user, id, context);
  }

  /** Busca la propiedad y exige que el usuario pueda gestionarla. */
  findManaged(user: AuthUserContext, id: string, context?: RequestContext): Promise<DbSupport.Property> {
    return this.ownership.require(this.access, user, id, 'manage', context);
  }

  private async findProperty(id: string): Promise<DbSupport.Property> {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }

  private async assertAgencyHasRoom(agencyId: string) {
    const [agency, count] = await Promise.all([
      this.prisma.agencyProfile.findUniqueOrThrow({ where: { id: agencyId } }),
      this.prisma.property.count({ where: { agencyId } }),
    ]);
    if (count >= agency.maxProperties) {
      throw new ConflictException(`Tu plan permite hasta ${agency.maxProperties} propiedades`);
    }
  }

  private log(action: string, user: AuthUserContext, id: string, context: RequestContext, metadata?: unknown) {
    return this.audit.log({
      action,
      userId: user.id,
      resource: 'Property',
      resourceId: id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata,
    });
  }
}
