import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser, RequestInfo } from '../../../common/security/decorators';
import { AuthGroup } from '../../../common/security/groups';
import type { AuthUserContext, RequestContext } from '../../../common/security/types';
import { FinishRegistrationDto, RegisterOptionsDto, RenamePasskeyDto } from './dto/passkey.dto';
import { PasskeyEnrollmentService } from './services/passkey-enrollment.service';

/** Mis passkeys. Entrar con una passkey vive en auth (/auth/passkeys/login y /step-up), porque crea la sesion. */
@ApiTags('auth / passkeys')
@AuthGroup()
@Controller('passkeys')
export class PasskeysController {
  constructor(private readonly enrollment: PasskeyEnrollmentService) {}

  /** Paso 1: opciones para `navigator.credentials.create()` (pide la contrasena y un dispositivo confirmado). */
  @Post('register/options')
  @AllowWithoutSecondFactor()
  @HttpCode(200)
  registerOptions(@CurrentUser() user: AuthUserContext, @Body() dto: RegisterOptionsDto, @RequestInfo() ctx: RequestContext) {
    return this.enrollment.start(user.id, dto.password, ctx);
  }

  /** Paso 2: guarda la passkey que creo el dispositivo. */
  @Post('register/verify')
  @AllowWithoutSecondFactor()
  registerVerify(@CurrentUser() user: AuthUserContext, @Body() dto: FinishRegistrationDto, @RequestInfo() ctx: RequestContext) {
    return this.enrollment.finish(user.id, dto, ctx);
  }

  @Get()
  @AllowWithoutSecondFactor()
  list(@CurrentUser() user: AuthUserContext) {
    return this.enrollment.list(user.id);
  }

  @Patch(':id')
  rename(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RenamePasskeyDto) {
    return this.enrollment.rename(user.id, id, dto.label);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string, @RequestInfo() ctx: RequestContext) {
    return this.enrollment.remove(user.id, id, ctx);
  }
}
