import { describe, expect, it, vi } from 'vitest';
import { css } from '../dc';
import { subscribeToasts, toast } from '../toast';

describe('css()', () => {
  it('convierte un string CSS inline en objeto style de React', () => {
    // espera: propiedades en camelCase y variables CSS intactas
    const style = css('background:var(--ac); font-size:14px; --ac:#5B4BE8; border-radius:999px');
    expect(style).toEqual({
      background: 'var(--ac)',
      fontSize: '14px',
      '--ac': '#5B4BE8',
      borderRadius: '999px',
    });
  });

  it('respeta los ; dentro de url() y de comillas', () => {
    const style = css("background:url(data:image/png;base64,AAA); font-family:'A;B', sans-serif");
    expect(style.background).toBe('url(data:image/png;base64,AAA)');
    expect(style.fontFamily).toBe("'A;B', sans-serif");
  });
});

describe('toast()', () => {
  it('avisa a los suscriptores con el texto y el tono', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToasts(listener);
    toast('Guardada en favoritos');
    toast('Límite alcanzado', 'warn');
    unsubscribe();
    toast('ya nadie escucha');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toMatchObject({ text: 'Límite alcanzado', tone: 'warn' });
  });
});
