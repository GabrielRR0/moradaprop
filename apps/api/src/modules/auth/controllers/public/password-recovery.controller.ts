import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequestInfo, RequireHumanCheck } from '@/common/security/decorators';
import { GuestGroup } from '@/common/security/groups';
import { EmailDto } from '../../contracts/dto/email-code.dto';
import { ResetPasswordDto } from '../../contracts/dto/reset-password.dto';
import type { MessageResource } from '../../contracts/resources';
import { AuthService } from '../../services/auth.service';
import type { RequestContext } from '../../utils/auth-context';

/** Recuperar la contrasena con un codigo por correo. Las respuestas no revelan si el correo existe. */
@GuestGroup()
@ApiTags('auth')
@Controller('password')
export class PasswordRecoveryController {
  constructor(private readonly authService: AuthService) {}

  @RequireHumanCheck()
  @HttpCode(200)
  @Post('forgot')
  forgotPassword(@Body() dto: EmailDto, @RequestInfo() ctx: RequestContext): Promise<MessageResource> {
    return this.authService.forgotPassword(dto.email, ctx);
  }

  @HttpCode(200)
  @Post('reset')
  resetPassword(@Body() dto: ResetPasswordDto, @RequestInfo() ctx: RequestContext): Promise<MessageResource> {
    return this.authService.resetPassword(dto, ctx);
  }
}
