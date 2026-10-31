import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { CreateAppointmentDto } from '@/modules/appointments/contracts/dto/create-appointment.dto';
import { ListAppointmentsDto } from '@/modules/appointments/contracts/dto/list-appointments.dto';
import type { AppointmentClientListResource, AppointmentClientResource } from '@/modules/appointments/contracts/resources';
import { AppointmentsService } from '@/modules/appointments/services/appointments.service';

/** Lo que hace el cliente: pedir una cita o apartado, ver sus solicitudes y cancelarlas. El cliente sale siempre del token. */
@AuthGroup()
@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentClientResource> {
    return this.appointmentsService.create(user, dto, ctx);
  }

  /** Mis solicitudes (como cliente). */
  @Get('mine')
  mine(@Query() query: ListAppointmentsDto, @CurrentUser() user: AuthUserContext): Promise<AppointmentClientListResource> {
    return this.appointmentsService.mine(user, query);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentClientResource> {
    return this.appointmentsService.cancel(user, id, ctx);
  }
}
