import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { AppointmentMessageVault, AppointmentVault, OwnershipService } from '@/modules/security';
import type { ProposeSlotsDto } from '../../contracts/dto/propose-slots.dto';
import type { SendMessageDto } from '../../contracts/dto/send-message.dto';
import type { AppointmentThreadResource } from '../../contracts/resources';
import { EDIT_WINDOW_MS, MAX_MESSAGES, assertOpen, assertVisitDate, sideOf, touch } from '../../utils/conversation';
import { AppointmentPolicy } from '../access/appointment.policy';
import { AppointmentNotifier } from '../notify/appointment-notifier.service';
import { AppointmentThreadReaderService } from './appointment-thread-reader.service';

const DEFAULT_NOTE = 'Te propongo estas fechas para la visita.';

/** Escribir en la conversacion: mensajes de texto, fechas propuestas por quien gestiona y la fecha que acepta el cliente. */
@Injectable()
export class AppointmentConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AppointmentPolicy,
    private readonly ownership: OwnershipService,
    private readonly audit: AuditService,
    private readonly notifier: AppointmentNotifier,
    private readonly messageVault: AppointmentMessageVault,
    private readonly appointmentVault: AppointmentVault,
    private readonly reader: AppointmentThreadReaderService,
  ) {}

  /** Un mensaje de texto de cualquiera de las dos partes. Si responde quien gestiona por primera vez, la cita pasa a ABIERTA. */
  async send(user: AuthUserContext, id: string, dto: SendMessageDto, context: RequestContext): Promise<AppointmentThreadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'write', context);
    assertOpen(appointment.status);
    await this.assertRoom(id);

    const side = sideOf(user, appointment);
    await this.prisma.$transaction([
      this.prisma.appointmentMessage.create({ data: this.messageVault.encode({ id: randomUUID(), appointmentId: id, authorId: user.id, body: dto.body }) }),
      this.prisma.appointment.update({ where: { id }, data: touch(side, appointment.status, appointment.respondedAt) }),
    ]);
    await (side === 'client' ? this.notifier.toManagers(id, 'message') : this.notifier.toClient(id, 'message'));
    await this.log('appointments.message.sent', user, id, context);
    return this.reader.build(id, side);
  }

  /**
   * Edita un mensaje propio de texto, hasta 3 minutos despues de enviarlo (la regla la hace cumplir esta consulta,
   * no solo la pantalla). Editar no sube la conversacion en la bandeja ni avisa: solo corrige el texto y deja la marca "editado".
   */
  async edit(user: AuthUserContext, id: string, messageId: string, dto: SendMessageDto, context: RequestContext): Promise<AppointmentThreadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'write', context);
    assertOpen(appointment.status);

    const message = await this.prisma.appointmentMessage.findFirst({ where: { id: messageId, appointmentId: id } });
    if (!message) throw new NotFoundException('Mensaje no encontrado');
    if (message.authorId !== user.id) throw new ForbiddenException('Solo puedes editar tus propios mensajes');
    if (message.kind !== 'TEXTO') throw new BadRequestException('Este mensaje no se puede editar');

    const { body } = this.messageVault.encode({ id: messageId, body: dto.body });
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // La ventana va dentro de la misma consulta: si ya pasaron 3 minutos no actualiza nada.
      const updated = await tx.appointmentMessage.updateMany({
        where: { id: messageId, createdAt: { gte: new Date(now.getTime() - EDIT_WINDOW_MS) } },
        data: { body, editedAt: now },
      });
      if (updated.count === 0) throw new BadRequestException('Ya pasaron más de 3 minutos: este mensaje ya no se puede editar');

      // El primer mensaje del cliente tambien vive en la solicitud (campo "message"): se mantiene igual.
      const first = await tx.appointmentMessage.findFirst({ where: { appointmentId: id }, orderBy: { createdAt: 'asc' }, select: { id: true } });
      if (first?.id === messageId && message.authorId === appointment.clientId) {
        await tx.appointment.update({ where: { id }, data: this.appointmentVault.encode({ message: dto.body }) });
      }
    });
    await this.log('appointments.message.edited', user, id, context);
    return this.reader.build(id, sideOf(user, appointment));
  }

  /** Quien gestiona ofrece fechas de visita. Las que seguian sin aceptarse se descartan: solo hay una propuesta viva. */
  async propose(user: AuthUserContext, id: string, dto: ProposeSlotsDto, context: RequestContext): Promise<AppointmentThreadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'propose', context);
    assertOpen(appointment.status);
    await this.assertRoom(id);

    const dates = [...new Set(dto.slots.map((slot) => new Date(slot).getTime()))].sort().map((time) => new Date(time));
    dates.forEach(assertVisitDate);

    await this.prisma.$transaction(async (tx) => {
      await tx.appointmentSlot.updateMany({ where: { appointmentId: id, status: 'PROPUESTA' }, data: { status: 'DESCARTADA' } });
      await tx.appointmentMessage.create({
        data: {
          ...this.messageVault.encode({ id: randomUUID(), appointmentId: id, authorId: user.id, kind: 'PROPUESTA' as const, body: dto.note || DEFAULT_NOTE }),
          slots: { create: dates.map((startsAt) => ({ appointmentId: id, startsAt })) },
        },
      });
      // Ofrecer fechas convierte un interes o una pregunta en una visita.
      const toVisit = appointment.type === 'INTERES' || appointment.type === 'PREGUNTA';
      await tx.appointment.update({
        where: { id },
        data: { ...touch('manager', appointment.status, appointment.respondedAt), ...(toVisit ? { type: 'VISITA' as const } : {}) },
      });
    });
    await this.notifier.toClient(id, 'proposal');
    await this.log('appointments.slots.proposed', user, id, context, { count: dates.length });
    return this.reader.build(id, 'manager');
  }

  /** El cliente acepta una de las fechas: queda registrada la visita y las demas se descartan. */
  async accept(user: AuthUserContext, id: string, slotId: string, context: RequestContext): Promise<AppointmentThreadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'accept', context);
    assertOpen(appointment.status);

    const slot = await this.prisma.appointmentSlot.findFirst({ where: { id: slotId, appointmentId: id } });
    if (!slot || slot.status !== 'PROPUESTA') throw new BadRequestException('Esa fecha ya no esta disponible');
    if (slot.startsAt.getTime() <= Date.now()) throw new BadRequestException('Esa fecha ya paso, pide otra al anunciante');

    await this.prisma.$transaction(async (tx) => {
      // El primero que la toma gana: si otra peticion la acepto antes, no actualiza nada.
      const taken = await tx.appointmentSlot.updateMany({ where: { id: slotId, status: 'PROPUESTA' }, data: { status: 'ACEPTADA' } });
      if (taken.count === 0) throw new BadRequestException('Esa fecha ya no esta disponible');
      await tx.appointmentSlot.updateMany({
        where: { appointmentId: id, id: { not: slotId }, status: { in: ['PROPUESTA', 'ACEPTADA'] } },
        data: { status: 'DESCARTADA' },
      });
      await tx.appointmentMessage.create({
        data: this.messageVault.encode({ id: randomUUID(), appointmentId: id, authorId: user.id, kind: 'ACUERDO' as const, body: slot.startsAt.toISOString() }),
      });
      await tx.appointment.update({
        where: { id },
        data: {
          ...touch('client', appointment.status, appointment.respondedAt),
          type: 'VISITA',
          status: 'CONFIRMADA',
          scheduledAt: slot.startsAt,
          respondedAt: appointment.respondedAt ?? new Date(),
        },
      });
    });
    await this.notifier.toManagers(id, 'accepted');
    await this.log('appointments.slot.accepted', user, id, context);
    return this.reader.build(id, 'client');
  }

  private async assertRoom(id: string): Promise<void> {
    const total = await this.prisma.appointmentMessage.count({ where: { appointmentId: id } });
    if (total >= MAX_MESSAGES) throw new BadRequestException('Esta conversacion llego al limite de mensajes');
  }

  private log(action: string, user: AuthUserContext, id: string, context: RequestContext, metadata?: unknown) {
    return this.audit.log({ action, userId: user.id, resource: 'Appointment', resourceId: id, ip: context.ip, userAgent: context.userAgent, metadata });
  }
}
