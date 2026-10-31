import { AppConfig } from '@/config';
import { loadEnv } from '@/config/env';
import { describeCase } from '@/../test/support/describe-case';
import { HealthService } from '../services/health.service';

describe('HealthService', () => {
  const config = new AppConfig(loadEnv());
  const service = new HealthService(config);

  describeCase('health', {
    que: 'responde que la API esta viva',
    espera: 'status "ok" con el nombre de la app y una fecha ISO',
    ejecutar: () => service.check(),
    verificar: (resultado) => {
      expect(resultado.status).toBe('ok');
      expect(resultado.app).toBe(config.app.name);
      expect(new Date(resultado.timestamp).toISOString()).toBe(resultado.timestamp);
    },
  });
});
