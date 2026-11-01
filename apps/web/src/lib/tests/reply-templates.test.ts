import { describe, expect, it } from 'vitest';
import { fillTemplate } from '../reply-templates/fill';

describe('fillTemplate', () => {
  it('cambia {nombre} por el primer nombre y {propiedad} por el titulo', () => {
    expect(fillTemplate('Hola {nombre}, {propiedad} sigue disponible.', { name: 'María José Pérez', property: 'Apto en Chacao' })).toBe(
      'Hola María, Apto en Chacao sigue disponible.',
    );
  });

  it('acepta mayusculas y repite la variable si aparece varias veces', () => {
    expect(fillTemplate('{NOMBRE}, {nombre}!', { name: 'Ana' })).toBe('Ana, Ana!');
  });

  it('si falta el dato, la variable desaparece sin dejar espacios raros', () => {
    expect(fillTemplate('Hola {nombre}, gracias por escribir.', {})).toBe('Hola, gracias por escribir.');
    expect(fillTemplate('{nombre} te escribo por {propiedad}.', { property: 'Casa' })).toBe('te escribo por Casa.');
  });

  it('deja el texto igual si no tiene variables', () => {
    expect(fillTemplate('Atendemos de lunes a viernes.', { name: 'Ana', property: 'Casa' })).toBe('Atendemos de lunes a viernes.');
  });
});
