import { Injectable } from '@nestjs/common';
import { AppConfig } from '@/config';
import type { HumanCheckResource } from '../../contracts/resources';

/** Le dice a la web si la verificación "no soy un robot" está activa y con qué clave pública dibujar el widget. */
@Injectable()
export class HumanCheckService {
  constructor(private readonly config: AppConfig) {}

  /** La clave secreta nunca sale de aquí: solo la pública, y solo cuando está activa. */
  describe(): HumanCheckResource {
    const { enabled, siteKey } = this.config.security.turnstile;
    return { enabled, siteKey: enabled ? siteKey : null };
  }
}
