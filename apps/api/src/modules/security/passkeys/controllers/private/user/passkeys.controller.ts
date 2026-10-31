import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { FinishRegistrationDto, RegisterOptionsDto, RenamePasskeyDto } from '@/modules/security/passkeys/contracts/dto/passkey.dto';
import type {
  PasskeyListResource,
  PasskeyRegisteredResource,
  PasskeyRegistrationOptionsResource,
  PasskeyRenamedResource,
} from '@/modules/security/passkeys/contracts/resources';
import { PasskeyEnrollmentService } from '@/modules/security/passkeys/services/registration/passkey-enrollment.service';

/** Mis passkeys. Entrar con una passkey vive en auth (/auth/passkeys/login y /step-up), porque crea la sesion. */
@AuthGroup()
@ApiTags('auth / passkeys')
@Controller('passkeys')
export class PasskeysController {
  constructor(private readonly enrollment: PasskeyEnrollmentService) {}

  /** Paso 1: opciones para `navigator.credentials.create()` (pide la contrasena y un dispositivo confirmado). */
  @AllowWithoutSecondFactor()
  @HttpCode(200)
  @Post('register/options')
  registerOptions(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: RegisterOptionsDto,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PasskeyRegistrationOptionsResource> {
    return this.enrollment.start(user.id, dto.password, ctx);
  }

  /** Paso 2: guarda la passkey que creo el dispositivo. */
  @AllowWithoutSecondFactor()
  @Post('register/verify')
  registerVerify(
    @CurrentUser() user: AuthUserContext,
    @Body() dto: FinishRegistrationDto,
    @RequestInfo() ctx: RequestContext,
  ): Promise<PasskeyRegisteredResource> {
    return this.enrollment.finish(user.id, dto, ctx);
  }

  @AllowWithoutSecondFactor()
  @Get()
  list(@CurrentUser() user: AuthUserContext): Promise<PasskeyListResource> {
    return this.enrollment.list(user.id);
  }

  @Patch(':id')
  rename(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RenamePasskeyDto): Promise<PasskeyRenamedResource> {
    return this.enrollment.rename(user.id, id, dto.label);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(@CurrentUser() user: AuthUserContext, @Param('id', ParseUUIDPipe) id: string, @RequestInfo() ctx: RequestContext) {
    return this.enrollment.remove(user.id, id, ctx);
  }
}
