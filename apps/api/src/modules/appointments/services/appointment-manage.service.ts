import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppConfig } from '../../../config';
import { MailService } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import type { AuthUser, RequestContext } from '../../../common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '../../../common/storage';
import { AuditService } from '../../audit';
import { AppointmentVault, OwnershipService, UserVault } from '../../security';
import { PropertyPolicyService } from '../../properties';
import type { ListAppointmentsDto, RespondAppointmentDto } from '../dto/appointments.dto';
import { AppointmentPolicy } from './appointment.policy';
import { appointmentInclude, toClientView, toLeadView } from '../utils/appointment-mapper';

@Injectable()
export class AppointmentManageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly access: AppointmentPolicy,
    private readonly ownership: OwnershipService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
    private readonly vault: UserVault,
    private readonly appointmentVault: AppointmentVault,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  // ---------------- Lo que ve el cliente ----------------

  async mine(user: AuthUser, query: ListAppointmentsDto) {
    return this.page({ clientId: user.id, status: query.status, propertyId: query.propertyId }, query, toClientView);
  }

  /** El cliente cancela su solicitud. Si cancela un apartado confirmado, la propiedad vuelve a publicarse. */
  async cancel(user: AuthUser, id: string, context: RequestContext) {
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
    await this.log('appointments.cancelled', user, id, context);
    return this.reload(id, toClientView);
  }

  // ---------------- Lo que ve quien gestiona ----------------

  /** Leads de las propiedades que el usuario gestiona (dueno, agencia o agente asignado). */
  async received(user: AuthUser, query: ListAppointmentsDto) {
    const managed = await this.policy.managedFilter(user);
    return this.page({ property: managed, status: query.status, propertyId: query.propertyId }, query, toLeadView);
  }

  /**
   * Responde un lead. Confirmar un APARTADO marca la propiedad como RESERVADA
   * (sigue visible con la insignia "En Proceso de Reserva").
   */
  async respond(user: AuthUser, id: string, dto: RespondAppointmentDto, context: RequestContext) {
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

    const full = await this.reload(id, toLeadView);
    // Se espera el envio (MailService ya traga sus errores). Con la cola de trabajos pasara a ser un job.
    await this.notifyClient(id, confirm, dto.note);
    await this.log(confirm ? 'appointments.confirmed' : 'appointments.rejected', user, id, context, { type: appointment.type });
    return full;
  }

  /** Marca la visita como realizada. */
  async complete(user: AuthUser, id: string, context: RequestContext) {
    const appointment = await this.ownership.require(this.access, user, id, 'complete', context);
    if (appointment.status !== 'CONFIRMADA') throw new BadRequestException('Solo se completan solicitudes confirmadas');

    await this.prisma.appointment.update({ where: { id }, data: { status: 'COMPLETADA' } });
    await this.log('appointments.completed', user, id, context);
    return this.reload(id, toLeadView);
  }

  // ---------------- Internos ----------------

  private async page<T>(
    where: Prisma.AppointmentWhereInput,
    query: ListAppointmentsDto,
    map: (row: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>, storage: StorageProvider) => T,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({ where, include: appointmentInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items: rows.map((row) => map({ ...this.appointmentVault.decode(row), client: this.vault.decode(row.client) }, this.storage)), total, page, limit };
  }

  private async reload<T>(
    id: string,
    map: (row: Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>, storage: StorageProvider) => T,
  ) {
    const row = await this.prisma.appointment.findUniqueOrThrow({ where: { id }, include: appointmentInclude });
    return map({ ...this.appointmentVault.decode(row), client: this.vault.decode(row.client) }, this.storage);
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

  private log(action: string, user: AuthUser, id: string, context: RequestContext, metadata?: unknown) {
    return this.audit.log({ action, userId: user.id, resource: 'Appointment', resourceId: id, ip: context.ip, userAgent: context.userAgent, metadata });
  }
}
