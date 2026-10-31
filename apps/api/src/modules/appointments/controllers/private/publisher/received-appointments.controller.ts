import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { PublisherGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { ListAppointmentsDto } from '@/modules/appointments/contracts/dto/list-appointments.dto';
import { RespondAppointmentDto } from '@/modules/appointments/contracts/dto/respond-appointment.dto';
import type { AppointmentLeadListResource, AppointmentLeadResource } from '@/modules/appointments/contracts/resources';
import { AppointmentsService } from '@/modules/appointments/services/appointments.service';

/** Leads de las propiedades que gestiono (como dueno, agencia o agente): verlos, responderlos y completarlos. */
@PublisherGroup()
@ApiTags('appointments')
@Controller()
export class ReceivedAppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('received')
  received(@Query() query: ListAppointmentsDto, @CurrentUser() user: AuthUserContext): Promise<AppointmentLeadListResource> {
    return this.appointmentsService.received(user, query);
  }

  @Patch(':id/respond')
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondAppointmentDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentLeadResource> {
    return this.appointmentsService.respond(user, id, dto, ctx);
  }

  @Patch(':id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentLeadResource> {
    return this.appointmentsService.complete(user, id, ctx);
  }
}
