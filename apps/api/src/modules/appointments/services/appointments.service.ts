import { Injectable } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import type { CreateAppointmentDto } from '../contracts/dto/create-appointment.dto';
import type { ListAppointmentsDto } from '../contracts/dto/list-appointments.dto';
import type { RespondAppointmentDto } from '../contracts/dto/respond-appointment.dto';
import { AppointmentClientService } from './booking/appointment-client.service';
import { AppointmentCreateService } from './booking/appointment-create.service';
import { AppointmentLeadsService } from './leads/appointment-leads.service';

/** Fachada del modulo: controllers solo hablan con este service. */
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly creator: AppointmentCreateService,
    private readonly client: AppointmentClientService,
    private readonly leads: AppointmentLeadsService,
  ) {}

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
}
