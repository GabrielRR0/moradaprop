import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser } from '../../../common/security/decorators';
import { AuthGroup } from '../../../common/security/groups';
import type { AuthUser } from '../../../common/security/types';
import { SecondFactorService } from './services/second-factor.service';

@ApiTags('auth / segundo factor')
@AuthGroup()
@Controller('second-factor')
export class SecondFactorController {
  constructor(private readonly secondFactor: SecondFactorService) {}

  /** ¿Debo activar passkey o 2FA? ¿Hasta cuando? ¿Ya lo hice? (Se puede consultar aunque la cuenta este limitada.) */
  @Get()
  @AllowWithoutSecondFactor()
  status(@CurrentUser() user: AuthUser) {
    return this.secondFactor.statusOf(user.id);
  }
}
