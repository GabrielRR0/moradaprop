import { Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser, RequestInfo } from '../../../common/security/decorators';
import { AuthGroup } from '../../../common/security/groups';
import type { AuthUser, RequestContext } from '../../../common/security/types';
import { DeviceRegistryService } from './services/device-registry.service';

/** Dispositivos del propio usuario (siempre filtrados por el userId del token, nunca por la URL). */
@ApiTags('auth / dispositivos')
@AuthGroup()
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DeviceRegistryService) {}

  @Get()
  @AllowWithoutSecondFactor()
  async list(@CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    const [items, current] = await Promise.all([this.devices.list(user.id), this.devices.find(user.id, ctx.deviceToken)]);
    return { items: items.map((d) => ({ ...d, current: d.id === current?.id })) };
  }

  /** Quita un dispositivo y cierra las sesiones abiertas desde el. Uno ajeno responde 404, como si no existiera. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @RequestInfo() ctx: RequestContext) {
    if (!(await this.devices.revoke(user.id, id, ctx.ip))) throw new NotFoundException('Dispositivo no encontrado');
  }
}
