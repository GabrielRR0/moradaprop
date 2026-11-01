import { describe, expect, it } from 'vitest';
import { availabilityOf, dayLabel, previewOf, STARTERS, STATUS_LABEL, timeAgo, TYPE_LABEL } from '../appointments/format';

const NOW = new Date(2026, 10, 5, 12, 0, 0); // 5 de noviembre de 2026, mediodia (hora local)

describe('timeAgo', () => {
  const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60000).toISOString();

  it('dice "ahora", minutos, horas, ayer y dias', () => {
    expect(timeAgo(ago(0), NOW.getTime())).toBe('ahora');
    expect(timeAgo(ago(5), NOW.getTime())).toBe('hace 5 min');
    expect(timeAgo(ago(3 * 60), NOW.getTime())).toBe('hace 3 h');
    expect(timeAgo(ago(24 * 60), NOW.getTime())).toBe('ayer');
    expect(timeAgo(ago(4 * 24 * 60), NOW.getTime())).toBe('hace 4 días');
  });
});

describe('dayLabel', () => {
  it('agrupa los mensajes en Hoy, Ayer o la fecha', () => {
    expect(dayLabel(new Date(2026, 10, 5, 8, 0).toISOString(), NOW)).toBe('Hoy');
    expect(dayLabel(new Date(2026, 10, 4, 22, 0).toISOString(), NOW)).toBe('Ayer');
    expect(dayLabel(new Date(2026, 10, 1, 9, 0).toISOString(), NOW)).toContain('noviembre');
  });
});

describe('previewOf', () => {
  it('muestra el texto tal cual y resume las fechas propuestas y el acuerdo', () => {
    expect(previewOf('TEXTO', 'Hola')).toBe('Hola');
    expect(previewOf('PROPUESTA', 'x')).toContain('fechas');
    expect(previewOf('ACUERDO', new Date(2026, 10, 10, 15, 0).toISOString())).toContain('Visita acordada');
  });
});

describe('availabilityOf', () => {
  const property = { id: '1', title: 't', location: '', thumb: null };

  it('distingue disponible, reservada con citas y reservada del todo', () => {
    expect(availabilityOf({ ...property, status: 'PUBLICADA', acceptsVisits: true })).toBe('free');
    expect(availabilityOf({ ...property, status: 'RESERVADA', acceptsVisits: true })).toBe('reserved-open');
    expect(availabilityOf({ ...property, status: 'RESERVADA', acceptsVisits: false })).toBe('reserved-closed');
  });
});

describe('textos', () => {
  it('cada tipo y estado tiene su etiqueta y cada opcion sus mensajes de ejemplo', () => {
    expect(Object.keys(TYPE_LABEL)).toEqual(['INTERES', 'PREGUNTA', 'VISITA', 'RESERVA']);
    expect(STATUS_LABEL.PENDIENTE).toBe('Esperando respuesta');
    for (const examples of Object.values(STARTERS)) expect(examples.length).toBeGreaterThan(0);
  });
});
