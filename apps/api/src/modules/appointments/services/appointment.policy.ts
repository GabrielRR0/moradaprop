import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';
import type { AuthUser } from '../../../common/security/types';
import type { ResourcePolicy } from '../../security';
import { PropertyPolicyService } from '../../properties';
import { DbSupport } from '../../../support/db';

export type AppointmentWithProperty = DbSupport.Prisma.AppointmentGetPayload<{ include: { property: true } }>;

/**
 * Pertenencia de una cita para OwnershipService.
 *   cancel            -> el cliente que la pidio
 *   respond, complete -> quien gestiona la propiedad
 * Quien no cumple recibe 404: el id de una cita no es publico y no se confirma que existe.
 */
@Injectable()
export class AppointmentPolicy implements ResourcePolicy<AppointmentWithProperty> {
  readonly resource = 'Appointment';
  readonly notFound = 'Solicitud no encontrada';

  constructor(
    private readonly prisma: PrismaService,
    private readonly properties: PropertyPolicyService,
  ) {}

  find(id: string) {
    return this.prisma.appointment.findUnique({ where: { id }, include: { property: true } });
  }

  can(user: AuthUser, appointment: AppointmentWithProperty, action: string) {
    switch (action) {
      case 'cancel':
        return appointment.clientId === user.id;
      case 'respond':
      case 'complete':
        return this.properties.canManage(user, appointment.property);
      default:
        return false;
    }
  }
}
