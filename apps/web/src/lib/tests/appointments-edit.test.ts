import { describe, expect, it } from 'vitest';
import { formatCountdown, msLeft } from '../appointments/format';

describe('msLeft (ventana de 3 minutos para editar)', () => {
  const now = Date.parse('2026-11-05T12:00:00.000Z');
  const until = '2026-11-05T12:03:00.000Z';

  it('cuenta lo que falta y nunca baja de cero', () => {
    expect(msLeft(until, 0, now)).toBe(180_000);
    expect(msLeft(until, 0, now + 60_000)).toBe(120_000);
    expect(msLeft(until, 0, now + 200_000)).toBe(0);
  });

  it('usa el reloj del servidor: si este dispositivo va adelantado, se corrige con el desfase', () => {
    // El dispositivo marca 5 minutos de mas; el servidor dijo que el mensaje se envio justo ahora.
    const deviceNow = now + 5 * 60_000;
    const skew = now - deviceNow; // hora del servidor menos hora local
    expect(msLeft(until, skew, deviceNow)).toBe(180_000);
  });
});

describe('formatCountdown', () => {
  it('muestra minutos y segundos', () => {
    expect(formatCountdown(180_000)).toBe('3:00');
    expect(formatCountdown(161_000)).toBe('2:41');
    expect(formatCountdown(59_400)).toBe('1:00');
    expect(formatCountdown(5_000)).toBe('0:05');
    expect(formatCountdown(0)).toBe('0:00');
  });
});
