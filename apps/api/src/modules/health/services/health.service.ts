import { Injectable } from '@nestjs/common';
import { AppConfig } from '@/config';
import type { HealthResource } from '../contracts/resources';

@Injectable()
export class HealthService {
  constructor(private readonly config: AppConfig) {}

  check(): HealthResource {
    return {
      status: 'ok' as const,
      app: this.config.app.name,
      environment: this.config.app.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }
}
