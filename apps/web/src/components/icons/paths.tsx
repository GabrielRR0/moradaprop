import type { ReactNode } from 'react';

/** Dibujo de cada icono (cuadricula 24x24). Para agregar uno: una entrada nueva aqui. */
export const ICON_PATHS = {
  'arrow-right': (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
    </>
  ),
  calendar: (
    <>
      <path d="M8 2v4M16 2v4M3 10h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  check: (
    <>
      <path d="M5 12l5 5 9-10" />
    </>
  ),
  'chevron-down': (
    <>
      <path d="M6 9l6 6 6-6" />
    </>
  ),
  'chevron-left': (
    <>
      <path d="M15 6l-6 6 6 6" />
    </>
  ),
  'chevron-up': (
    <>
      <path d="M6 15l6-6 6 6" />
    </>
  ),
  clipboard: (
    <>
      <path d="M9 4h6M9 4a2 2 0 00-2 2v0H5a1 1 0 00-1 1v13a1 1 0 001 1h14a1 1 0 001-1V7a1 1 0 00-1-1h-2v0a2 2 0 00-2-2M8 12h8M8 16h5" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  dots: (
    <>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
    </>
  ),
  droplet: (
    <>
      <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6" />
    </>
  ),
  'file-error': (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M9 13l5 5M14 13l-5 5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  heart: (
    <>
      <path d="M20.8 5.6a5.2 5.2 0 00-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 00-7.4 7.4L12 21.8l8.8-8.8a5.2 5.2 0 000-7.4z" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  house: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2" />
      <path d="M21 16l-5-5-8 8" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
      <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
    </>
  ),
  map: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  minus: (
    <>
      <path d="M5 12h14" />
    </>
  ),
  monitor: (
    <>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  moon: (
    <>
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.5 0-.8-.6-1.2-.6-2 0-.9.7-1.5 1.6-1.5H17a4 4 0 004-4c0-5-4-9-9-9z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10.5" cy="7" r="1" />
      <circle cx="15.5" cy="8" r="1" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l4-1 11-11a2.1 2.1 0 00-3-3L5 16z" />
    </>
  ),
  'pencil-draw': (
    <>
      <path d="M4 20l4-1 11-11a2.1 2.1 0 00-3-3L5 16z" />
      <path d="M14 7l3 3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 11-3-6.7" />
      <path d="M21 4v5h-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7M17 4.5a3.5 3.5 0 010 7M22 21c0-3.2-2-5.7-5-6.7" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="10" cy="8" r="4" />
      <path d="M2 21c0-4 3.6-7 8-7M19 14v6M16 17h6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M21 12a9 9 0 01-13.4 7.8L3 21l1.3-4.4A9 9 0 1121 12z" />
    </>
  ),
  wifi: (
    <>
      <path d="M2 9a15 15 0 0120 0" />
      <path d="M5 12.5a10.5 10.5 0 0114 0" />
      <path d="M8.5 16a5.5 5.5 0 017 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18.2v.01" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 012-2h10" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6A17 17 0 002 12s3.6 7 10 7a9.700 9.700 0 004.400-1.100" />
      <path d="M9.9 9.9a3 3 0 004.200 4.200" />
    </>
  ),
  fingerprint: (
    <>
      <path d="M12 11a2 2 0 00-2 2c0 3 .5 5 1.500 7M12 7a6 6 0 00-6 6c0 2 .2 3.500.7 5M12 3a10 10 0 00-9 5.500M17 20c.5-1.500 1-3.500 1-7a6 6 0 00-9.500-4.800M14.500 13c0 3 .3 4.800 1 6.500M21 13.500c0-.8 0-1.700-.2-2.500A10 10 0 0018 6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.800 12.200L21 2M17 6l3 3M14 9l2 2" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  smartphone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2.500" />
      <path d="M11 18h2" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </>
  ),
  message: (
    <>
      <path d="M21 12a8 8 0 01-11.8 7L3 21l1.9-5.5A8 8 0 1121 12z" />
      <path d="M8.500 11h7M8.500 14.500h4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.600 9.500a2.500 2.500 0 114 2c-.9.6-1.600 1.100-1.600 2.200M12 17.200h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.500 2" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICON_PATHS;
