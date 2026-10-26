import { Injectable } from '@nestjs/common';
import type { Property } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';
import type { AuthUser } from '../../../common/security/types';
import type { ResourcePolicy } from '../../security';
import { PropertyPolicyService } from './property-policy.service';

/** Pertenencia de una propiedad para OwnershipService. El id es publico, por eso responde 403. */
@Injectable()
export class PropertyAccessPolicy implements ResourcePolicy<Property> {
  readonly resource = 'Property';
  readonly notFound = 'Propiedad no encontrada';
  readonly forbidden = 'No puedes modificar esta propiedad';

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
  ) {}

  find(id: string) {
    return this.prisma.property.findUnique({ where: { id } });
  }

  can(user: AuthUser, property: Property, action: string) {
    return action === 'manage' && this.policy.canManage(user, property);
  }
}
