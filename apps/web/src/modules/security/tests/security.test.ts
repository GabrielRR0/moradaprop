import { describe, expect, it } from 'vitest';
import type { SecurityEvent } from '@/lib/api-types';
import { timeLeft } from '../services/deadline';
import { describeEvent, timeAgo } from '../services/event-copy';

const event = (type: string, level: SecurityEvent['level'] = 'LOW'): SecurityEvent => ({
  id: '1',
  at: '2026-10-26T00:00:00Z',
  type,
  title: 'Titulo del servidor',
  level,
  country: 'VE',
  device: 'Chrome en Windows',
  details: [],
});

describe('plazo del segundo factor', () => {
  const now = new Date('2026-10-26T00:00:00Z').getTime();
  it('cuenta dias, horas y minutos', () => {
    expect(timeLeft('2026-10-29T00:00:00Z', now).text).toBe('3 días');
    expect(timeLeft('2026-10-26T05:00:00Z', now).text).toBe('5 horas');
    expect(timeLeft('2026-10-26T00:12:00Z', now).text).toBe('12 minutos');
  });
  it('detecta el plazo vencido', () => {
    expect(timeLeft('2026-10-25T00:00:00Z', now).expired).toBe(true);
  });
});

describe('avisos de seguridad', () => {
  it('las alertas se marcan como tales', () => {
    expect(describeEvent(event('risk.denied', 'HIGH')).severity).toBe('alert');
    expect(describeEvent(event('risk.passkey.cloned', 'HIGH')).severity).toBe('alert');
  });
  it('un inicio nuevo es informativo y dice desde donde', () => {
    const copy = describeEvent(event('risk.assessed', 'MEDIUM'));
    expect(copy.severity).toBe('info');
    expect(copy.text).toContain('VE');
  });
  it('un tipo desconocido usa el texto del servidor', () => {
    expect(describeEvent(event('risk.algo.nuevo')).text).toBe('Titulo del servidor');
  });
  it('formatea el tiempo transcurrido', () => {
    const now = new Date('2026-10-26T01:00:00Z').getTime();
    expect(timeAgo('2026-10-26T00:00:00Z', now)).toBe('hace 1 h');
    expect(timeAgo('2026-10-26T00:59:30Z', now)).toBe('justo ahora');
  });
});
