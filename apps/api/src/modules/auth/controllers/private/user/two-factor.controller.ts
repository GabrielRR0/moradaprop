import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { TwoFactorConfirmDto, TwoFactorDisableDto } from '@/modules/auth/contracts/dto/two-factor.dto';
import type { BackupCodesResource, MessageResource, TwoFactorEnabledResource, TwoFactorSetupResource } from '@/modules/auth/contracts/resources';
import { AuthService } from '@/modules/auth/services/auth.service';

/** Activar, desactivar y renovar los codigos de respaldo del segundo factor (app de autenticacion). */
@AuthGroup()
@ApiTags('auth')
@Controller('2fa')
export class TwoFactorController {
  constructor(private readonly authService: AuthService) {}

  // Excepcion: activar el 2FA se puede hacer aunque la cuenta aun deba activarlo (es justamente lo que le falta).
  @AllowWithoutSecondFactor()
  @HttpCode(200)
  @Post('setup')
  setup(@CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<TwoFactorSetupResource> {
    return this.authService.twoFactorSetup(user.id, ctx);
  }

  @AllowWithoutSecondFactor()
  @HttpCode(200)
  @Post('confirm')
  confirm(
    @Body() dto: TwoFactorConfirmDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<TwoFactorEnabledResource> {
    return this.authService.twoFactorConfirm(user.id, user.sessionId, dto.code, ctx);
  }

  @HttpCode(200)
  @Post('disable')
  disable(
    @Body() dto: TwoFactorDisableDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<MessageResource> {
    return this.authService.twoFactorDisable(user.id, user.sessionId, dto.password, dto.code, ctx);
  }

  @HttpCode(200)
  @Post('backup-codes')
  backupCodes(
    @Body() dto: TwoFactorDisableDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<BackupCodesResource> {
    return this.authService.twoFactorBackupCodes(user.id, dto.password, dto.code, ctx);
  }
}
