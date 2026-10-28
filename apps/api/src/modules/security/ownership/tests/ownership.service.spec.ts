import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describeCase } from '../../../../../test/support/describe-case';
import type { AuthUser } from '../../../../common/security/types';
import type { AuditService } from '../../../audit';
import { ACCESS_DENIED_ACTION, OwnershipService } from '../services/ownership.service';
import type { ResourcePolicy } from '../types';
import { DbSupport } from '../../../../support/db';

interface Doc {
  id: string;
  userId: string;
}

const DOCS: Doc[] = [{ id: 'doc-1', userId: 'ana' }];
const user = (id: string): AuthUser => ({ id, roles: [DbSupport.Role.CLIENT], sessionId: 's', twoFactor: false });

const policy = (extra: Partial<ResourcePolicy<Doc>> = {}): ResourcePolicy<Doc> => ({
  resource: 'Doc',
  notFound: 'Documento no encontrado',
  find: async (id) => DOCS.find((d) => d.id === id) ?? null,
  can: (u, doc, action) => action === 'read' && doc.userId === u.id,
  ...extra,
});

const setup = () => {
  const log = jest.fn().mockResolvedValue(undefined);
  return { log, service: new OwnershipService({ log } as unknown as AuditService) };
};

const intento = (promesa: Promise<unknown>) => promesa.then(() => null, (e: Error) => e);

describe('OwnershipService.require', () => {
  describeCase('ownership', {
    que: 'el dueno obtiene su recurso',
    espera: 'devuelve el documento y no audita nada',
    ejecutar: async () => {
      const { service, log } = setup();
      return { doc: await service.require(policy(), user('ana'), 'doc-1', 'read'), auditado: log.mock.calls.length };
    },
    verificar: ({ doc, auditado }) => {
      expect(doc.id).toBe('doc-1');
      expect(auditado).toBe(0);
    },
  });

  describeCase('ownership', {
    que: 'un usuario ajeno pide un recurso que existe y uno que no existe',
    espera: 'ambos reciben 404 con el mismo mensaje (no se confirma que el id existe)',
    ejecutar: async () => {
      const { service } = setup();
      const ajeno = await intento(service.require(policy(), user('beto'), 'doc-1', 'read'));
      const inexistente = await intento(service.require(policy(), user('beto'), 'otro-id', 'read'));
      return { ajeno, inexistente };
    },
    verificar: ({ ajeno, inexistente }) => {
      expect(ajeno).toBeInstanceOf(NotFoundException);
      expect(inexistente).toBeInstanceOf(NotFoundException);
      expect(ajeno?.message).toBe(inexistente?.message);
    },
    describirObtenido: ({ ajeno }) => `${ajeno?.constructor.name}: ${ajeno?.message}`,
  });

  describeCase('ownership', {
    que: 'un rechazo queda en auditoria con usuario, recurso, id, accion e IP',
    espera: 'un evento access.denied con esos datos',
    ejecutar: async () => {
      const { service, log } = setup();
      await intento(service.require(policy(), user('beto'), 'doc-1', 'read', { ip: '1.2.3.4' }));
      return log.mock.calls[0][0];
    },
    verificar: (evento) =>
      expect(evento).toMatchObject({
        action: ACCESS_DENIED_ACTION,
        userId: 'beto',
        resource: 'Doc',
        resourceId: 'doc-1',
        ip: '1.2.3.4',
        metadata: { action: 'read' },
      }),
  });

  describeCase('ownership', {
    que: 'una accion que la politica no conoce',
    espera: 'se rechaza aunque sea el dueno',
    ejecutar: () => intento(setup().service.require(policy(), user('ana'), 'doc-1', 'borrar-todo')),
    verificar: (error) => expect(error).toBeInstanceOf(NotFoundException),
  });

  describeCase('ownership', {
    que: 'la politica define `forbidden` (recurso con id publico)',
    espera: '403 con su mensaje; el que no existe sigue siendo 404',
    ejecutar: async () => {
      const { service } = setup();
      const p = policy({ forbidden: 'No puedes tocar esto' });
      return {
        ajeno: await intento(service.require(p, user('beto'), 'doc-1', 'read')),
        inexistente: await intento(service.require(p, user('beto'), 'otro-id', 'read')),
      };
    },
    verificar: ({ ajeno, inexistente }) => {
      expect(ajeno).toBeInstanceOf(ForbiddenException);
      expect(ajeno?.message).toBe('No puedes tocar esto');
      expect(inexistente).toBeInstanceOf(NotFoundException);
    },
    describirObtenido: ({ ajeno, inexistente }) => `${ajeno?.constructor.name} / ${inexistente?.constructor.name}`,
  });
});
