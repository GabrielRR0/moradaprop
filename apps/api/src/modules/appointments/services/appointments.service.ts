import { Injectable } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '../../../common/security/types';
import type { CreateAppointmentDto, ListAppointmentsDto, RespondAppointmentDto } from '../dto/appointments.dto';
import { AppointmentCreateService } from './appointment-create.service';
import { AppointmentManageService } from './appointment-manage.service';

/** Fachada del modulo. */
@Injectable()
export class AppointmentsService {
  constructor(
    private readonly creator: AppointmentCreateService,
    private readonly manager: AppointmentManageService,
  ) {}

  create(user: AuthUserContext, dto: CreateAppointmentDto, ctx: RequestContext) {
    return this.creator.create(user, dto, ctx);
  }
  mine(user: AuthUserContext, query: ListAppointmentsDto) {
    return this.manager.mine(user, query);
  }
  cancel(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.manager.cancel(user, id, ctx);
  }
  received(user: AuthUserContext, query: ListAppointmentsDto) {
    return this.manager.received(user, query);
  }
  respond(user: AuthUserContext, id: string, dto: RespondAppointmentDto, ctx: RequestContext) {
    return this.manager.respond(user, id, dto, ctx);
  }
  complete(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.manager.complete(user, id, ctx);
  }
}
