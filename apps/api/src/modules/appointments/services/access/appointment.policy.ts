import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import type { ResourcePolicy } from '@/modules/security';
import { PropertyPolicyService } from '@/modules/properties';
import { DbSupport } from '@/support/db';

export type AppointmentWithProperty = DbSupport.Prisma.AppointmentGetPayload<{ include: { property: true } }>;

/**
 * Pertenencia de una cita para OwnershipService.
 *   cancel, accept                    -> el cliente que la pidio
 *   view, write                       -> el cliente o quien gestiona la propiedad (la conversacion)
 *   respond, complete, propose, close -> quien gestiona la propiedad
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

  can(user: AuthUserContext, appointment: AppointmentWithProperty, action: string): boolean | Promise<boolean> {
    const isClient = appointment.clientId === user.id;
    switch (action) {
      case 'cancel':
      case 'accept':
        return isClient;
      case 'view':
      case 'write':
        return isClient || this.properties.canManage(user, appointment.property);
      case 'respond':
      case 'complete':
      case 'propose':
      case 'close':
        return this.properties.canManage(user, appointment.property);
      default:
        return false;
    }
  }
}
