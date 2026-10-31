import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { OwnershipService } from '@/modules/security';
import type { ListAppointmentsDto } from '../../contracts/dto/list-appointments.dto';
import type { AppointmentClientListResource, AppointmentClientResource } from '../../contracts/resources';
import { AppointmentPolicy } from '../access/appointment.policy';
import { AppointmentReaderService } from '../reader/appointment-reader.service';

/** Lo que hace el cliente con sus solicitudes: verlas y cancelarlas. */
@Injectable()
export class AppointmentClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AppointmentPolicy,
    private readonly ownership: OwnershipService,
    private readonly audit: AuditService,
    private readonly reader: AppointmentReaderService,
  ) {}

  mine(user: AuthUserContext, query: ListAppointmentsDto): Promise<AppointmentClientListResource> {
    return this.reader.clientPage({ clientId: user.id, status: query.status, propertyId: query.propertyId }, query);
  }

  /** El cliente cancela su solicitud. Si cancela un apartado confirmado, la propiedad vuelve a publicarse. */
  async cancel(user: AuthUserContext, id: string, context: RequestContext): Promise<AppointmentClientResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'cancel', context);
    if (!['PENDIENTE', 'CONFIRMADA'].includes(appointment.status)) {
      throw new BadRequestException('Esta solicitud ya no se puede cancelar');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id }, data: { status: 'CANCELADA' } });
      if (appointment.type === 'RESERVA' && appointment.status === 'CONFIRMADA') {
        const otherActive = await tx.appointment.count({
          where: { propertyId: appointment.propertyId, type: 'RESERVA', status: 'CONFIRMADA', id: { not: id } },
        });
        if (otherActive === 0) {
          await tx.property.updateMany({ where: { id: appointment.propertyId, status: 'RESERVADA' }, data: { status: 'PUBLICADA' } });
        }
      }
    });
    await this.audit.log({
      action: 'appointments.cancelled',
      userId: user.id,
      resource: 'Appointment',
      resourceId: id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return this.reader.asClient(id);
  }
}
