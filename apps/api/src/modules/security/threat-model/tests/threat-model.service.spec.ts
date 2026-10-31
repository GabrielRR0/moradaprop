import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { describeCase } from '@/../test/support/describe-case';
import type { AppConfig } from '@/config';
import type { AuditService } from '@/modules/audit';
import type { SecurityService } from '@/modules/security/blocks';
import { FILE_CHECKS } from '../file-checks';
import { ThreatLedgerService } from '../services/threat-ledger.service';
import { ThreatModelService } from '../services/threat-model.service';
import { ThreatResponseService } from '../services/threat-response.service';
import { SHIELDS } from '../shields';
import type { FileCheck, ResponseFacts, ThreatMode } from '../types';
import { DbSupport } from '@/support/db';

const USER = '11111111-1111-4111-8111-111111111111';

const setup = (mode: ThreatMode, checks: readonly FileCheck[] = FILE_CHECKS) => {
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const security = { blockTemporarily: jest.fn().mockResolvedValue(undefined) };
  const config = { app: { isProduction: false }, security: { threatMode: mode } } as unknown as AppConfig;
  const response = new ThreatResponseService(audit as unknown as AuditService, security as unknown as SecurityService);
  const service = new ThreatModelService(config, new ThreatLedgerService(), response, SHIELDS, checks);
  return { service, audit, security };
};

const respuesta = (status: number, extra: Partial<ResponseFacts> = {}): ResponseFacts => ({
  status,
  method: 'GET',
  path: '/api/x',
  ip: '9.9.9.9',
  ...extra,
});
const repetir = async (n: number, fn: () => Promise<unknown>) => {
  for (let i = 0; i < n; i++) await fn();
};
const eventos = (audit: { log: jest.Mock }, action: string) => audit.log.mock.calls.map((c) => c[0]).filter((e) => e.action === action);

describe('ThreatModelService.observe', () => {
  describeCase('threat-model', {
    que: 'un usuario autenticado acumula 10 respuestas 403 en pocos minutos (escudo E, privilege-probing)',
    espera: 'en enforce: se audita threat.detected y se bloquea su USER con vencimiento',
    ejecutar: async () => {
      const { service, audit, security } = setup('enforce');
      await repetir(10, () => service.observe(respuesta(403, { userId: USER, roles: [DbSupport.Role.CLIENT] })));
      return { detectado: eventos(audit, 'threat.detected'), bloqueos: security.blockTemporarily.mock.calls };
    },
    verificar: ({ detectado, bloqueos }) => {
      expect(detectado).toHaveLength(1);
      expect(detectado[0]).toMatchObject({ resourceId: 'privilege-probing', metadata: { stride: 'E', blocked: true } });
      expect(bloqueos).toHaveLength(1);
      expect(bloqueos[0].slice(0, 2)).toEqual([DbSupport.BlockType.USER, USER]);
      expect(bloqueos[0][3].getTime()).toBeGreaterThan(Date.now());
    },
    describirObtenido: ({ detectado, bloqueos }) => `${detectado.length} deteccion, ${bloqueos.length} bloqueo`,
  });

  describeCase('threat-model', {
    que: 'lo mismo en modo monitor',
    espera: 'se audita pero NO se bloquea a nadie',
    ejecutar: async () => {
      const { service, audit, security } = setup('monitor');
      await repetir(10, () => service.observe(respuesta(403, { userId: USER })));
      return { detectado: eventos(audit, 'threat.detected'), bloqueos: security.blockTemporarily.mock.calls.length };
    },
    verificar: ({ detectado, bloqueos }) => {
      expect(detectado[0].metadata).toMatchObject({ blocked: false, mode: 'monitor' });
      expect(bloqueos).toBe(0);
    },
  });

  describeCase('threat-model', {
    que: 'un administrador dispara el mismo escudo en enforce',
    espera: 'se audita pero nunca se bloquea (no puede quedarse fuera del panel)',
    ejecutar: async () => {
      const { service, security } = setup('enforce');
      await repetir(10, () => service.observe(respuesta(403, { userId: USER, roles: [DbSupport.Role.ADMIN] })));
      return security.blockTemporarily.mock.calls.length;
    },
    verificar: (bloqueos) => expect(bloqueos).toBe(0),
  });

  describeCase('threat-model', {
    que: 'un visitante sin sesion hace 20 respuestas 401 (escudo S, credential-guessing)',
    espera: 'se bloquea su IP',
    ejecutar: async () => {
      const { service, security } = setup('enforce');
      await repetir(20, () => service.observe(respuesta(401)));
      return security.blockTemporarily.mock.calls[0]?.slice(0, 2);
    },
    verificar: (bloqueo) => expect(bloqueo).toEqual([DbSupport.BlockType.IP, '9.9.9.9']),
  });

  describeCase('threat-model', {
    que: 'una IP crea cuentas nuevas una tras otra (escudo S, mass-registration, limite 8 por hora)',
    espera: 'con 7 cuentas no pasa nada; la octava bloquea su IP por 2 horas',
    ejecutar: async () => {
      const { service, security } = setup('enforce');
      await repetir(7, () => service.report('mass-registration', { ip: '9.9.9.9' }));
      const con7 = security.blockTemporarily.mock.calls.length;
      await service.report('mass-registration', { ip: '9.9.9.9' });
      return { con7, bloqueo: security.blockTemporarily.mock.calls[0] };
    },
    verificar: ({ con7, bloqueo }) => {
      expect(con7).toBe(0);
      expect(bloqueo.slice(0, 2)).toEqual([DbSupport.BlockType.IP, '9.9.9.9']);
      expect((bloqueo[3].getTime() - Date.now()) / 60_000).toBeGreaterThan(119);
    },
    describirObtenido: ({ con7, bloqueo }) => `con 7: ${con7} bloqueos; con 8: ${bloqueo?.[0]} ${bloqueo?.[1]}`,
  });

  describeCase('threat-model', {
    que: 'una IP deja 3 cuentas bloqueadas por fallar el segundo factor (escudo S, account-takeover-attempt)',
    espera: 'con 2 bloqueos solo se cuenta; el 3ro bloquea su IP por 2 horas (nunca a la victima)',
    ejecutar: async () => {
      const { service, security } = setup('enforce');
      await repetir(2, () => service.report('account-takeover-attempt', { ip: '82.60.60.60' }));
      const con2 = security.blockTemporarily.mock.calls.length;
      await service.report('account-takeover-attempt', { ip: '82.60.60.60' });
      return { con2, bloqueo: security.blockTemporarily.mock.calls[0] };
    },
    verificar: ({ con2, bloqueo }) => {
      expect(con2).toBe(0);
      expect(bloqueo.slice(0, 2)).toEqual([DbSupport.BlockType.IP, '82.60.60.60']);
      expect((bloqueo[3].getTime() - Date.now()) / 60_000).toBeGreaterThan(119);
    },
  });

  describeCase('threat-model', {
    que: 'respuestas que no son ataque: 404 de /uploads, 200 y pocas 403',
    espera: 'ninguna cuenta: no hay detecciones',
    ejecutar: async () => {
      const { service, audit } = setup('enforce');
      await repetir(100, () => service.observe(respuesta(404, { path: '/uploads/thumb/x.webp' })));
      await repetir(100, () => service.observe(respuesta(200)));
      await repetir(9, () => service.observe(respuesta(403)));
      return audit.log.mock.calls.length;
    },
    verificar: (eventosAuditados) => expect(eventosAuditados).toBe(0),
  });

  describeCase('threat-model', {
    que: 'modo off',
    espera: 'no cuenta nada aunque haya mil 401',
    ejecutar: async () => {
      const { service, audit } = setup('off');
      await repetir(1000, () => service.observe(respuesta(401)));
      return audit.log.mock.calls.length;
    },
    verificar: (n) => expect(n).toBe(0),
  });
});

describe('ThreatModelService.inspectFiles', () => {
  const sujeto = { userId: USER, ip: '9.9.9.9', roles: [DbSupport.Role.OWNER] };
  const intento = (p: Promise<unknown>) => p.then(() => null, (e: Error) => e);
  const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(0x3a), Buffer.from([0x80, 0, 0, 0]), Buffer.alloc(0x40), Buffer.from('PE\0\0')]);

  describeCase('threat-model', {
    que: 'una imagen y una planilla normales',
    espera: 'pasan todas las revisiones sin error',
    ejecutar: () =>
      setup('monitor').service.inspectFiles(
        [
          { buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]), filename: 'sala.jpg', mimetype: 'image/jpeg' },
          { buffer: Buffer.from('titulo,precio\nCasa,100\n'), filename: 'propiedades.csv', mimetype: 'text/csv' },
        ],
        sujeto,
      ),
    verificar: (resultado) => expect(resultado).toBeUndefined(),
    describirObtenido: () => 'sin error',
  });

  describeCase('threat-model', {
    que: 'un .exe de Windows disfrazado de foto.jpg',
    espera: '400 generico (no dice por que), queda auditado threat.file.rejected y cuenta en malicious-upload',
    ejecutar: async () => {
      const { service, audit } = setup('monitor');
      const error = await intento(service.inspectFiles([{ buffer: exe, filename: 'foto.jpg', mimetype: 'image/jpeg' }], sujeto));
      return { error, rechazos: eventos(audit, 'threat.file.rejected') };
    },
    verificar: ({ error, rechazos }) => {
      expect(error).toBeInstanceOf(BadRequestException);
      expect(error?.message).toBe('El archivo fue rechazado por seguridad');
      expect(rechazos[0]).toMatchObject({ resourceId: 'executable-content', userId: USER, ip: '9.9.9.9' });
    },
    describirObtenido: ({ error, rechazos }) => `${error?.constructor.name}; auditado por ${rechazos[0]?.resourceId}`,
  });

  describeCase('threat-model', {
    que: 'tres archivos maliciosos seguidos del mismo usuario (escudo malicious-upload) en enforce',
    espera: 'el tercero dispara el bloqueo de su USER por 60 minutos',
    ejecutar: async () => {
      const { service, security } = setup('enforce');
      for (let i = 0; i < 3; i++) {
        await intento(service.inspectFiles([{ buffer: Buffer.from('x'), filename: 'virus.php.jpg' }], sujeto));
      }
      return security.blockTemporarily.mock.calls[0];
    },
    verificar: (bloqueo) => {
      expect(bloqueo.slice(0, 2)).toEqual([DbSupport.BlockType.USER, USER]);
      const minutos = (bloqueo[3].getTime() - Date.now()) / 60_000;
      expect(minutos).toBeGreaterThan(59);
    },
  });

  describeCase('threat-model', {
    que: 'una revision que falla al ejecutarse (error inesperado)',
    espera: '503 y el archivo NO pasa: nunca se deja pasar sin revisar',
    ejecutar: () => {
      const caido: FileCheck = {
        id: 'revision-rota',
        stride: 'T',
        description: 'prueba',
        inspect: () => Promise.reject(new Error('fallo inesperado')),
      };
      return intento(setup('monitor', [caido]).service.inspectFiles([{ buffer: Buffer.from('ok'), filename: 'a.csv' }], sujeto));
    },
    verificar: (error) => expect(error).toBeInstanceOf(ServiceUnavailableException),
  });
});
