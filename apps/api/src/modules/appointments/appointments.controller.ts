import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, RequestInfo } from '../../common/security/decorators';
import { AuthGroup, RoleGroup } from '../../common/security/groups';
import type { AuthUser, RequestContext } from '../../common/security/types';
import { CreateAppointmentDto, ListAppointmentsDto, RespondAppointmentDto } from './dto/appointments.dto';
import { AppointmentsService } from './services/appointments.service';

/** El cliente y el dueno salen siempre del token. Las rutas fijas van antes que ":id". */
@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @AuthGroup()
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.appointmentsService.create(user, dto, ctx);
  }

  /** Mis solicitudes (como cliente). */
  @AuthGroup()
  @Get('mine')
  mine(@Query() query: ListAppointmentsDto, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.mine(user, query);
  }

  /** Leads de las propiedades que gestiono (como dueno, agencia o agente). */
  @RoleGroup(Role.OWNER, Role.AGENCY, Role.ADMIN)
  @Get('received')
  received(@Query() query: ListAppointmentsDto, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.received(user, query);
  }

  @RoleGroup(Role.OWNER, Role.AGENCY, Role.ADMIN)
  @Patch(':id/respond')
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondAppointmentDto,
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    return this.appointmentsService.respond(user, id, dto, ctx);
  }

  @RoleGroup(Role.OWNER, Role.AGENCY, Role.ADMIN)
  @Patch(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.appointmentsService.complete(user, id, ctx);
  }

  @AuthGroup()
  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.appointmentsService.cancel(user, id, ctx);
  }
}
