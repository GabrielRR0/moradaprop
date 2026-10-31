import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import type { PasskeyAuthenticationOptionsResource } from '@/modules/security';
import { ReverifyCodeDto, ReverifyPasskeyDto } from '@/modules/auth/contracts/dto/reverify.dto';
import type { ReverifyResource } from '@/modules/auth/contracts/resources';
import { AuthService } from '@/modules/auth/services/auth.service';

/**
 * Volver a comprobar el segundo factor para las acciones sensibles (las rutas con @RecentTwoFactor()).
 * Si una de ellas responde 403 RECENT_TWO_FACTOR_REQUIRED, el cliente llama aqui y repite la accion.
 */
@AuthGroup()
@ApiTags('auth')
@Controller('reverify')
export class ReverifyController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('code')
  withCode(@Body() dto: ReverifyCodeDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<ReverifyResource> {
    return this.authService.reverifyWithCode(user, dto.code, ctx);
  }

  @HttpCode(200)
  @Post('passkey/options')
  passkeyOptions(@CurrentUser() user: AuthUserContext): Promise<PasskeyAuthenticationOptionsResource> {
    return this.authService.reverifyPasskeyOptions(user);
  }

  @HttpCode(200)
  @Post('passkey')
  withPasskey(@Body() dto: ReverifyPasskeyDto, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext): Promise<ReverifyResource> {
    return this.authService.reverifyWithPasskey(user, dto.credential, ctx);
  }
}
