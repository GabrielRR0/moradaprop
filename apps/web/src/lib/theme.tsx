'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/** Colores de marca entre los que se decide (el definitivo sigue pendiente). */
export const ACCENTS = [
  { name: 'Azul', value: '#2563EB' },
  { name: 'Violeta', value: '#5B4BE8' },
  { name: 'Verde', value: '#0E8A5F' },
  { name: 'Terracota', value: '#C2410C' },
] as const;

export const DEFAULT_ACCENT = '#5B4BE8';

interface ThemeValue {
  dark: boolean;
  accent: string;
  toggleDark: () => void;
  setAccent: (accent: string) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

function applyTheme(dark: boolean, accent: string) {
  const html = document.documentElement;
  html.classList.add('theme-anim');
  window.setTimeout(() => html.classList.remove('theme-anim'), 450);
  html.dataset.theme = dark ? 'dark' : 'light';
  html.style.setProperty('--ac', accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [accent, setAccentState] = useState(DEFAULT_ACCENT);

  // El script inline del layout ya pinto el tema guardado; aqui solo se sincroniza el estado.
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
    setAccentState(document.documentElement.style.getPropertyValue('--ac') || DEFAULT_ACCENT);
  }, []);

  const toggleDark = useCallback(() => {
    const next = !dark;
    setDark(next);
    applyTheme(next, accent);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }, [dark, accent]);

  const setAccent = useCallback(
    (value: string) => {
      setAccentState(value);
      applyTheme(dark, value);
      localStorage.setItem('accent', value);
    },
    [dark],
  );

  const value = useMemo(
    () => ({ dark, accent, toggleDark, setAccent }),
    [dark, accent, toggleDark, setAccent],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}

/** Script que corre antes de pintar para evitar el parpadeo claro/oscuro. */
export const themeInitScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t;var a=localStorage.getItem('accent');if(a)d.style.setProperty('--ac',a);d.classList.add('js')}catch(e){}})()`;
