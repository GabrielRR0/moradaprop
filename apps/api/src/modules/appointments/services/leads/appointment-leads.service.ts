import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfig } from '@/config';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { PropertyPolicyService } from '@/modules/properties';
import { AppointmentVault, OwnershipService, UserVault } from '@/modules/security';
import { MailSupport } from '@/support/mail';
import type { ListAppointmentsDto } from '../../contracts/dto/list-appointments.dto';
import type { RespondAppointmentDto } from '../../contracts/dto/respond-appointment.dto';
import type { AppointmentLeadListResource, AppointmentLeadResource } from '../../contracts/resources';
import { AppointmentPolicy } from '../access/appointment.policy';
import { AppointmentReaderService } from '../reader/appointment-reader.service';

/** Lo que hace quien gestiona la propiedad con los leads: verlos, responderlos y completarlos. */
@Injectable()
export class AppointmentLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly access: AppointmentPolicy,
    private readonly ownership: OwnershipService,
    private readonly mail: MailSupport.Service,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
    private readonly vault: UserVault,
    private readonly appointmentVault: AppointmentVault,
    private readonly reader: AppointmentReaderService,
  ) {}

  /** Leads de las propiedades que el usuario gestiona (dueno, agencia o agente asignado). */
  async received(user: AuthUserContext, query: ListAppointmentsDto): Promise<AppointmentLeadListResource> {
    const managed = await this.policy.managedFilter(user);
    return this.reader.leadPage({ property: managed, status: query.status, propertyId: query.propertyId }, query);
  }

  /**
   * Responde un lead. Confirmar un APARTADO marca la propiedad como RESERVADA
   * (sigue visible con la insignia "En Proceso de Reserva").
   */
  async respond(user: AuthUserContext, id: string, dto: RespondAppointmentDto, context: RequestContext): Promise<AppointmentLeadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'respond', context);
    if (appointment.status !== 'PENDIENTE') throw new BadRequestException('Esta solicitud ya fue respondida');

    const confirm = dto.action === 'CONFIRM';
    await this.prisma.$transaction(async (tx) => {
      if (confirm && appointment.type === 'RESERVA') {
        // Dos clientes no pueden quedarse con el mismo apartado: el primero en confirmarse gana.
        const reserved = await tx.property.updateMany({
          where: { id: appointment.propertyId, status: 'PUBLICADA' },
          data: { status: 'RESERVADA' },
        });
        if (reserved.count === 0) throw new BadRequestException('La propiedad ya no esta disponible para apartar');
      }
      await tx.appointment.update({
        where: { id },
        data: { status: confirm ? 'CONFIRMADA' : 'RECHAZADA', ...this.appointmentVault.encode({ responseNote: dto.note }), respondedAt: new Date() },
      });
    });

    const full = await this.reader.asLead(id);
    // Se espera el envio (MailSupport.Service ya traga sus errores). Con la cola de trabajos pasara a ser un job.
    await this.notifyClient(id, confirm, dto.note);
    await this.log(confirm ? 'appointments.confirmed' : 'appointments.rejected', user, id, context, { type: appointment.type });
    return full;
  }

  /** Marca la visita como realizada. */
  async complete(user: AuthUserContext, id: string, context: RequestContext): Promise<AppointmentLeadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'complete', context);
    if (appointment.status !== 'CONFIRMADA') throw new BadRequestException('Solo se completan solicitudes confirmadas');

    await this.prisma.appointment.update({ where: { id }, data: { status: 'COMPLETADA' } });
    await this.log('appointments.completed', user, id, context);
    return this.reader.asLead(id);
  }

  private async notifyClient(id: string, accepted: boolean, note?: string) {
    const row = await this.prisma.appointment.findUnique({ where: { id }, include: { client: true, property: true } });
    if (!row) return;
    await this.mail.send(this.vault.decode(row.client).email, {
      name: 'appointment-response',
      propertyTitle: row.property.title,
      kind: row.type === 'VISITA' ? 'visita' : 'apartado',
      accepted,
      note,
      link: `${this.config.app.frontendUrl}/appointments/${id}`,
    });
  }

  private log(action: string, user: AuthUserContext, id: string, context: RequestContext, metadata?: unknown) {
    return this.audit.log({ action, userId: user.id, resource: 'Appointment', resourceId: id, ip: context.ip, userAgent: context.userAgent, metadata });
  }
}
