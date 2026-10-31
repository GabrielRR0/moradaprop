import { Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import type { DeviceListResource } from '@/modules/security/access-risk/contracts/resources';
import { DeviceRegistryService } from '@/modules/security/access-risk/services/devices/device-registry.service';

/** Dispositivos del propio usuario (siempre filtrados por el userId del token, nunca por la URL). */
@AuthGroup()
@ApiTags('auth / dispositivos')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DeviceRegistryService) {}

  @AllowWithoutSecondFactor()
  @Get()
  async list(@CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<DeviceListResource> {
    const [items, current] = await Promise.all([this.devices.list(user.id), this.devices.find(user.id, ctx.deviceToken)]);
    return { items: items.map((d) => ({ ...d, current: d.id === current?.id })) };
  }

  /** Quita un dispositivo y cierra las sesiones abiertas desde el. Uno ajeno responde 404, como si no existiera. */
  @HttpCode(204)
  @Delete(':id')
  async remove(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string, @RequestInfo() ctx: RequestContext) {
    if (!(await this.devices.revoke(user.id, id, ctx.ip))) throw new NotFoundException('Dispositivo no encontrado');
  }
}
