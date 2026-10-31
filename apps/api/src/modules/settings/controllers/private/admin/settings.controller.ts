import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RecentTwoFactor, RequestInfo } from '@/common/security/decorators';
import { AdminGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { SetSettingDto } from '@/modules/settings/contracts/dto/set-setting.dto';
import type { MailTestResource, SettingResource } from '@/modules/settings/contracts/resources';
import { MailTestService } from '@/modules/settings/services/mail-test.service';
import { SettingsService } from '@/modules/settings/services/settings.service';

/** Ajustes de la plataforma (correo, etc.): solo administradores con 2FA. Guardar o quitar pide 2FA reciente. */
@AdminGroup()
@ApiTags('admin / ajustes')
@Controller()
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mailTestService: MailTestService,
  ) {}

  @Get()
  list(): Promise<SettingResource[]> {
    return this.settingsService.list();
  }

  /** Envia un correo de prueba al admin con la configuracion actual. */
  @HttpCode(200)
  @Post('mail/test')
  testMail(@CurrentUser() admin: AuthUserContext): Promise<MailTestResource> {
    return this.mailTestService.send(admin.id);
  }

  // Se audita dentro del service (solo la clave): el interceptor @Audit guardaria el cuerpo, que trae el secreto.
  @RecentTwoFactor()
  @Put(':key')
  set(@Param('key') key: string, @Body() dto: SetSettingDto, @CurrentUser() admin: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<SettingResource> {
    return this.settingsService.set(key, dto.value, admin.id, ctx);
  }

  @RecentTwoFactor()
  @Delete(':key')
  remove(@Param('key') key: string, @CurrentUser() admin: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<SettingResource> {
    return this.settingsService.remove(key, admin.id, ctx);
  }
}
