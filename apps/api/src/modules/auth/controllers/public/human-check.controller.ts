import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PublicGroup } from '@/common/security/groups';
import type { HumanCheckResource } from '../../contracts/resources';
import { AuthService } from '../../services/auth.service';

/** Dice si la verificación "no soy un robot" está activa. Pública: la web la consulta antes de dibujar los formularios. */
@PublicGroup()
@ApiTags('auth')
@Controller('human-check')
export class HumanCheckController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  humanCheck(): HumanCheckResource {
    return this.authService.humanCheck();
  }
}
