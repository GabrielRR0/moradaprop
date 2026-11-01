import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { PublisherGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { ListAppointmentsDto } from '@/modules/appointments/contracts/dto/list-appointments.dto';
import { ProposeSlotsDto } from '@/modules/appointments/contracts/dto/propose-slots.dto';
import { RespondAppointmentDto } from '@/modules/appointments/contracts/dto/respond-appointment.dto';
import type { AppointmentLeadListResource, AppointmentLeadResource, AppointmentThreadResource } from '@/modules/appointments/contracts/resources';
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

  /** Ofrece fechas de visita; el cliente acepta una desde la conversacion. */
  @Post(':id/slots')
  propose(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProposeSlotsDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentThreadResource> {
    return this.appointmentsService.proposeSlots(user, id, dto, ctx);
  }

  /** Cierra la conversacion (ya no se puede escribir en ella). */
  @Patch(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentLeadResource> {
    return this.appointmentsService.close(user, id, ctx);
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
