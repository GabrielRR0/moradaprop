import { Injectable } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import type { CreateAppointmentDto } from '../contracts/dto/create-appointment.dto';
import type { ListAppointmentsDto } from '../contracts/dto/list-appointments.dto';
import type { ProposeSlotsDto } from '../contracts/dto/propose-slots.dto';
import type { RespondAppointmentDto } from '../contracts/dto/respond-appointment.dto';
import type { SendMessageDto } from '../contracts/dto/send-message.dto';
import { AppointmentClientService } from './booking/appointment-client.service';
import { AppointmentCreateService } from './booking/appointment-create.service';
import { AppointmentLeadsService } from './leads/appointment-leads.service';
import { AppointmentConversationService } from './thread/appointment-conversation.service';
import { AppointmentThreadReaderService } from './thread/appointment-thread-reader.service';

/** Fachada del modulo: controllers solo hablan con este service. */
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly creator: AppointmentCreateService,
    private readonly client: AppointmentClientService,
    private readonly leads: AppointmentLeadsService,
    private readonly threads: AppointmentThreadReaderService,
    private readonly conversation: AppointmentConversationService,
  ) {}

  // La conversacion de una solicitud (cliente y quien gestiona)
  thread(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.threads.open(user, id, ctx);
  }
  sendMessage(user: AuthUserContext, id: string, dto: SendMessageDto, ctx: RequestContext) {
    return this.conversation.send(user, id, dto, ctx);
  }
  editMessage(user: AuthUserContext, id: string, messageId: string, dto: SendMessageDto, ctx: RequestContext) {
    return this.conversation.edit(user, id, messageId, dto, ctx);
  }

  // Lo que hace el cliente
  create(user: AuthUserContext, dto: CreateAppointmentDto, ctx: RequestContext) {
    return this.creator.create(user, dto, ctx);
  }
  mine(user: AuthUserContext, query: ListAppointmentsDto) {
    return this.client.mine(user, query);
  }
  cancel(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.client.cancel(user, id, ctx);
  }
  acceptSlot(user: AuthUserContext, id: string, slotId: string, ctx: RequestContext) {
    return this.conversation.accept(user, id, slotId, ctx);
  }

  // Lo que hace quien gestiona la propiedad
  received(user: AuthUserContext, query: ListAppointmentsDto) {
    return this.leads.received(user, query);
  }
  respond(user: AuthUserContext, id: string, dto: RespondAppointmentDto, ctx: RequestContext) {
    return this.leads.respond(user, id, dto, ctx);
  }
  complete(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.leads.complete(user, id, ctx);
  }
  close(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.leads.close(user, id, ctx);
  }
  proposeSlots(user: AuthUserContext, id: string, dto: ProposeSlotsDto, ctx: RequestContext) {
    return this.conversation.propose(user, id, dto, ctx);
  }
}
