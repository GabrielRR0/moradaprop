import type { PropertyCard } from './types';

/**
 * Propiedades de ejemplo para jugar con el mapa sin el API (mismas ciudades y zonas que
 * `apps/api/prisma/seed.ts`). Son deterministas: salen igual en cada recarga.
 */

interface Zone {
  name: string;
  municipality: string;
  lat: number;
  lng: number;
}
interface City {
  state: string;
  count: number;
  price: number;
  generator: number;
  zones: Zone[];
}

const CITIES: City[] = [
  {
    state: 'Miranda',
    count: 16,
    price: 1,
    generator: 0.7,
    zones: [
      { name: 'Los Palos Grandes', municipality: 'Chacao', lat: 10.4969, lng: -66.8477 },
      { name: 'Altamira', municipality: 'Chacao', lat: 10.5009, lng: -66.8467 },
      { name: 'La Castellana', municipality: 'Chacao', lat: 10.4972, lng: -66.853 },
      { name: 'El Rosal', municipality: 'Chacao', lat: 10.493, lng: -66.856 },
      { name: 'Las Mercedes', municipality: 'Baruta', lat: 10.483, lng: -66.861 },
      { name: 'Prados del Este', municipality: 'Baruta', lat: 10.456, lng: -66.864 },
      { name: 'Santa Fe', municipality: 'Baruta', lat: 10.462, lng: -66.876 },
      { name: 'La Lagunita', municipality: 'El Hatillo', lat: 10.429, lng: -66.82 },
      { name: 'Sebucan', municipality: 'Sucre', lat: 10.5, lng: -66.818 },
      { name: 'Los Chaguaramos', municipality: 'Libertador', lat: 10.488, lng: -66.893 },
      { name: 'La Florida', municipality: 'Libertador', lat: 10.504, lng: -66.9 },
    ],
  },
  {
    state: 'Carabobo',
    count: 8,
    price: 0.7,
    generator: 0.8,
    zones: [
      { name: 'Prebo', municipality: 'Valencia', lat: 10.2, lng: -68.0 },
      { name: 'La Trigaleña', municipality: 'Valencia', lat: 10.225, lng: -68.023 },
      { name: 'El Viñedo', municipality: 'Valencia', lat: 10.19, lng: -67.995 },
      { name: 'Naguanagua', municipality: 'Naguanagua', lat: 10.254, lng: -68.0 },
      { name: 'San Diego', municipality: 'San Diego', lat: 10.253, lng: -67.96 },
    ],
  },
  {
    state: 'Mérida',
    count: 6,
    price: 0.45,
    generator: 0.5,
    zones: [
      { name: 'Centro', municipality: 'Libertador', lat: 8.589, lng: -71.145 },
      { name: 'Los Curos', municipality: 'Libertador', lat: 8.605, lng: -71.17 },
      { name: 'La Parroquia', municipality: 'Libertador', lat: 8.61, lng: -71.1 },
      { name: 'Ejido', municipality: 'Campo Elías', lat: 8.548, lng: -71.238 },
    ],
  },
  {
    state: 'Aragua',
    count: 6,
    price: 0.6,
    generator: 0.75,
    zones: [
      { name: 'Las Delicias', municipality: 'Girardot', lat: 10.26, lng: -67.6 },
      { name: 'La Soledad', municipality: 'Girardot', lat: 10.24, lng: -67.59 },
      { name: 'El Limón', municipality: 'Mario Briceño Iragorry', lat: 10.3, lng: -67.63 },
      { name: 'Turmero', municipality: 'Santiago Mariño', lat: 10.229, lng: -67.475 },
    ],
  },
  {
    state: 'Zulia',
    count: 8,
    price: 0.8,
    generator: 0.95,
    zones: [
      { name: 'Bella Vista', municipality: 'Maracaibo', lat: 10.655, lng: -71.63 },
      { name: 'Tierra Negra', municipality: 'Maracaibo', lat: 10.67, lng: -71.62 },
      { name: 'Valle Frío', municipality: 'Maracaibo', lat: 10.69, lng: -71.645 },
      { name: 'La Lago', municipality: 'Maracaibo', lat: 10.64, lng: -71.61 },
      { name: 'Cabimas Centro', municipality: 'Cabimas', lat: 10.395, lng: -71.45 },
    ],
  },
  {
    state: 'Lara',
    count: 4,
    price: 0.55,
    generator: 0.7,
    zones: [
      { name: 'Nueva Segovia', municipality: 'Iribarren', lat: 10.07, lng: -69.31 },
      { name: 'Zona Este', municipality: 'Iribarren', lat: 10.075, lng: -69.28 },
    ],
  },
  {
    state: 'Anzoátegui',
    count: 4,
    price: 0.85,
    generator: 0.8,
    zones: [
      { name: 'Lechería', municipality: 'Urbaneja', lat: 10.19, lng: -64.69 },
      { name: 'Puerto La Cruz', municipality: 'Sotillo', lat: 10.215, lng: -64.63 },
    ],
  },
  {
    state: 'Nueva Esparta',
    count: 3,
    price: 0.9,
    generator: 0.85,
    zones: [
      { name: 'Pampatar', municipality: 'Maneiro', lat: 10.995, lng: -63.8 },
      { name: 'Porlamar', municipality: 'Mariño', lat: 10.957, lng: -63.85 },
    ],
  },
  {
    state: 'Bolívar',
    count: 3,
    price: 0.6,
    generator: 0.8,
    zones: [{ name: 'Alta Vista', municipality: 'Caroní', lat: 8.29, lng: -62.72 }],
  },
  {
    state: 'Táchira',
    count: 2,
    price: 0.45,
    generator: 0.6,
    zones: [{ name: 'Pueblo Nuevo', municipality: 'San Cristóbal', lat: 7.7669, lng: -72.225 }],
  },
];

const TYPES = [
  {
    type: 'APARTAMENTO',
    weight: 50,
    price: 380,
    beds: [1, 4],
    baths: [1, 3],
    area: 85,
    name: 'Apartamento',
  },
  { type: 'CASA', weight: 16, price: 900, beds: [3, 6], baths: [2, 5], area: 220, name: 'Casa' },
  {
    type: 'TOWNHOUSE',
    weight: 8,
    price: 750,
    beds: [3, 4],
    baths: [2, 4],
    area: 160,
    name: 'Townhouse',
  },
  {
    type: 'HABITACION',
    weight: 8,
    price: 110,
    beds: [1, 1],
    baths: [1, 1],
    area: 18,
    name: 'Habitación amoblada',
  },
  {
    type: 'LOCAL',
    weight: 7,
    price: 600,
    beds: [0, 0],
    baths: [1, 2],
    area: 70,
    name: 'Local comercial',
  },
  {
    type: 'OFICINA',
    weight: 6,
    price: 520,
    beds: [0, 0],
    baths: [1, 2],
    area: 60,
    name: 'Oficina',
  },
  {
    type: 'GALPON',
    weight: 3,
    price: 1400,
    beds: [0, 0],
    baths: [1, 2],
    area: 450,
    name: 'Galpón',
  },
  {
    type: 'TERRENO',
    weight: 2,
    price: 700,
    beds: [0, 0],
    baths: [0, 0],
    area: 600,
    name: 'Terreno',
  },
] as const;

const ADJETIVOS = [
  'luminoso',
  'amplio',
  'remodelado',
  'acogedor',
  'moderno',
  'con vista panorámica',
  'tranquilo y seguro',
];

/** Generador pseudoaleatorio con semilla (mulberry32). */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(): PropertyCard[] {
  const random = rng(20261023);
  const between = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
  const round = (n: number, step: number) => Math.round(n / step) * step;
  const out: PropertyCard[] = [];
  const now = Date.now();

  for (const city of CITIES) {
    for (let i = 0; i < city.count; i++) {
      const zone = city.zones[i % city.zones.length];
      let roll = random() * TYPES.reduce((sum, t) => sum + t.weight, 0);
      const kind = TYPES.find((t) => (roll -= t.weight) < 0) ?? TYPES[0];
      const price = Math.max(60, round(kind.price * city.price * (0.7 + random() * 0.9), 10));
      const status = random() < 0.12 ? 'RESERVADA' : 'PUBLICADA';
      const days = between(0, 40);
      out.push({
        id: `mock-${out.length + 1}`,
        title: `${kind.name} ${ADJETIVOS[between(0, ADJETIVOS.length - 1)]}`,
        type: kind.type,
        status,
        inReservation: status === 'RESERVADA',
        priceAmount: price,
        currency: 'USD',
        bedrooms: between(kind.beds[0], kind.beds[1]),
        bathrooms: between(kind.baths[0], kind.baths[1]),
        parkingSpots: kind.type === 'HABITACION' ? 0 : between(0, 2),
        areaM2: Math.round(kind.area * (0.8 + random() * 0.6)),
        state: city.state,
        municipality: zone.municipality,
        urbanization: zone.name,
        latitude: zone.lat + (random() - 0.5) * 0.012,
        longitude: zone.lng + (random() - 0.5) * 0.012,
        hasGenerator: random() < city.generator,
        hasWaterTank: random() < 0.6,
        hasFiberOptic: random() < 0.45,
        hasSecurity: random() < 0.5,
        cover: null,
        publishedAt: new Date(now - days * 86_400_000).toISOString(),
      });
    }
  }
  return out;
}

export const MOCK_PROPERTIES: PropertyCard[] = build();
