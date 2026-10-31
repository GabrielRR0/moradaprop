import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowWithoutSecondFactor, CurrentUser } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext } from '@/common/security/types';
import type { SecondFactorStatusResource } from '@/modules/security/second-factor/contracts/resources';
import { SecondFactorService } from '@/modules/security/second-factor/services/second-factor.service';

@AuthGroup()
@ApiTags('auth / segundo factor')
@Controller('second-factor')
export class SecondFactorController {
  constructor(private readonly secondFactor: SecondFactorService) {}

  /** ¿Debo activar passkey o 2FA? ¿Hasta cuando? ¿Ya lo hice? (Se puede consultar aunque la cuenta este limitada.) */
  @AllowWithoutSecondFactor()
  @Get()
  status(@CurrentUser() user: AuthUserContext): Promise<SecondFactorStatusResource> {
    return this.secondFactor.statusOf(user.id);
  }
}
