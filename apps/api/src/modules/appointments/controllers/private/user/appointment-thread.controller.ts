import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { SendMessageDto } from '@/modules/appointments/contracts/dto/send-message.dto';
import type { AppointmentThreadResource } from '@/modules/appointments/contracts/resources';
import { AppointmentsService } from '@/modules/appointments/services/appointments.service';

/**
 * La conversacion de una solicitud. La abren y escriben las dos partes (el cliente y quien gestiona la propiedad):
 * el acceso por solicitud lo decide AppointmentPolicy, no el rol. Aceptar una fecha es solo del cliente.
 */
@AuthGroup()
@ApiTags('appointments')
@Controller()
export class AppointmentThreadController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get(':id')
  thread(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentThreadResource> {
    return this.appointmentsService.thread(user, id, ctx);
  }

  @Post(':id/messages')
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentThreadResource> {
    return this.appointmentsService.sendMessage(user, id, dto, ctx);
  }

  /** Corrige un mensaje propio, hasta 3 minutos despues de enviarlo. */
  @Patch(':id/messages/:messageId')
  edit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentThreadResource> {
    return this.appointmentsService.editMessage(user, id, messageId, dto, ctx);
  }

  @Patch(':id/slots/:slotId/accept')
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('slotId', ParseUUIDPipe) slotId: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<AppointmentThreadResource> {
    return this.appointmentsService.acceptSlot(user, id, slotId, ctx);
  }
}
