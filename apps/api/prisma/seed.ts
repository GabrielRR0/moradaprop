/**
 * Datos de ejemplo para desarrollo:  pnpm db:seed   (Docker lo corre solo al arrancar la API)
 *
 * Crea (si no existen): un administrador, un dueno directo, una agencia con su administrador, un cliente
 * y ~120 propiedades repartidas por Venezuela (Caracas, Valencia, Merida, Aragua, Zulia y mas), cada una con
 * 3 fotos reales: hay 5 juegos de fotos en prisma/seed-photos y se reparten entre todas las propiedades. Es DETERMINISTA (mismos datos siempre) y no repite: si ya hay 120+ propiedades demo no hace
 * nada. Para regenerarlas desde cero:  pnpm db:seed -- --fresh
 * SE NIEGA a correr en produccion o contra una base remota (Supabase).
 *
 * Cuentas (clave de todas: Demo12345):
 *   admin@demo.local     ADMIN   (para entrar al panel activa primero el 2FA: /api/auth/2fa/setup)
 *   dueno@demo.local     OWNER
 *   agencia@demo.local   AGENCY  (administrador de "Inmuebles Demo")
 *   cliente@demo.local   CLIENT
 */
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { ImagesSupport } from '../src/support/images';
import { PasswordSupport } from '../src/support/password';
import { blockReason } from '../src/database/migration-guard';
import type { AppConfig } from '../src/config';
import { BlindIndexService } from '../src/modules/security/encryption/services/blind-index.service';
import { FieldCipher } from '../src/modules/security/encryption/services/field-cipher.service';
import { KeyRingService } from '../src/modules/security/encryption/services/key-ring.service';
import { AgencyVault } from '../src/modules/security/encryption/vaults/agency.vault';
import { UserVault } from '../src/modules/security/encryption/vaults/user.vault';
import { DbSupport } from '../src/support/db';

// Toma apps/api/.env si existe; sin variables, apunta a la base local de Docker (la misma que usa `pnpm db:*`).
if (existsSync('.env')) process.loadEnvFile('.env');
process.env.DATABASE_URL ??= 'postgresql://alquiler:alquiler@localhost:5433/alquiler';
process.env.DIRECT_URL ??= process.env.DATABASE_URL;

// Mismas claves que el API en desarrollo (docker-compose.yml): los datos personales se guardan cifrados.
const keyRing = new KeyRingService({
  security: {
    encryption: {
      keys: process.env.ENCRYPTION_KEYS || `v1:${process.env.ENCRYPTION_KEY ?? 'dev-encryption-key-change-me-0123456789abcdef'}`,
      activeVersion: process.env.ENCRYPTION_ACTIVE_VERSION ?? '',
    },
  },
} as AppConfig);
const cipher = new FieldCipher(keyRing);
const blindIndex = new BlindIndexService(keyRing);
const vault = new UserVault(cipher, blindIndex);
const agencyVault = new AgencyVault(cipher, blindIndex);

const PASSWORD = 'Demo12345';
const FRESH = process.argv.includes('--fresh');
/** Las cantidades por ciudad (count) se multiplican por esto: 2 => ~120 propiedades. */
const SCALE = 2;
const MIN_DEMO_PROPERTIES = 60 * SCALE;
const UPLOADS = resolve(process.env.STORAGE_LOCAL_DIR ?? 'uploads');
const WITH_IMAGES = (process.env.STORAGE_PROVIDER ?? 'local') === 'local';
const prisma = new DbSupport.PrismaClient();

const motivo = blockReason({ command: 'reset', databaseUrl: process.env.DATABASE_URL ?? '', nodeEnv: process.env.NODE_ENV });
if (motivo) {
  console.error(`[seed BLOQUEADO] El seed solo corre en la base local de desarrollo. ${motivo}`);
  process.exit(1);
}

// ---------------------------------------------------------------
// Datos base
// ---------------------------------------------------------------

interface Zone {
  name: string;
  municipality: string;
  lat: number;
  lng: number;
}
interface City {
  label: string;
  state: string;
  count: number;
  /** Multiplicador de precio respecto a Caracas */
  price: number;
  /** Probabilidad de planta electrica (en Zulia casi todos tienen) */
  generator: number;
  zones: Zone[];
}

const CITIES: City[] = [
  {
    label: 'Caracas', state: 'Miranda', count: 16, price: 1, generator: 0.7,
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
    label: 'Valencia', state: 'Carabobo', count: 8, price: 0.7, generator: 0.8,
    zones: [
      { name: 'Prebo', municipality: 'Valencia', lat: 10.2, lng: -68.0 },
      { name: 'La Trigaleña', municipality: 'Valencia', lat: 10.225, lng: -68.023 },
      { name: 'El Viñedo', municipality: 'Valencia', lat: 10.19, lng: -67.995 },
      { name: 'Naguanagua', municipality: 'Naguanagua', lat: 10.254, lng: -68.0 },
      { name: 'San Diego', municipality: 'San Diego', lat: 10.253, lng: -67.96 },
    ],
  },
  {
    label: 'Merida', state: 'Mérida', count: 6, price: 0.45, generator: 0.5,
    zones: [
      { name: 'Centro', municipality: 'Libertador', lat: 8.589, lng: -71.145 },
      { name: 'Los Curos', municipality: 'Libertador', lat: 8.605, lng: -71.17 },
      { name: 'La Parroquia', municipality: 'Libertador', lat: 8.61, lng: -71.1 },
      { name: 'Ejido', municipality: 'Campo Elías', lat: 8.548, lng: -71.238 },
    ],
  },
  {
    label: 'Maracay', state: 'Aragua', count: 6, price: 0.6, generator: 0.75,
    zones: [
      { name: 'Las Delicias', municipality: 'Girardot', lat: 10.26, lng: -67.6 },
      { name: 'La Soledad', municipality: 'Girardot', lat: 10.24, lng: -67.59 },
      { name: 'El Limón', municipality: 'Mario Briceño Iragorry', lat: 10.3, lng: -67.63 },
      { name: 'Turmero', municipality: 'Santiago Mariño', lat: 10.229, lng: -67.475 },
    ],
  },
  {
    label: 'Maracaibo', state: 'Zulia', count: 8, price: 0.8, generator: 0.95,
    zones: [
      { name: 'Bella Vista', municipality: 'Maracaibo', lat: 10.655, lng: -71.63 },
      { name: 'Tierra Negra', municipality: 'Maracaibo', lat: 10.67, lng: -71.62 },
      { name: 'Valle Frío', municipality: 'Maracaibo', lat: 10.69, lng: -71.645 },
      { name: 'La Lago', municipality: 'Maracaibo', lat: 10.64, lng: -71.61 },
      { name: 'Cabimas Centro', municipality: 'Cabimas', lat: 10.395, lng: -71.45 },
    ],
  },
  {
    label: 'Barquisimeto', state: 'Lara', count: 4, price: 0.55, generator: 0.7,
    zones: [
      { name: 'Nueva Segovia', municipality: 'Iribarren', lat: 10.07, lng: -69.31 },
      { name: 'Zona Este', municipality: 'Iribarren', lat: 10.075, lng: -69.28 },
    ],
  },
  {
    label: 'Costa Oriental', state: 'Anzoátegui', count: 4, price: 0.85, generator: 0.8,
    zones: [
      { name: 'Lechería', municipality: 'Urbaneja', lat: 10.19, lng: -64.69 },
      { name: 'Puerto La Cruz', municipality: 'Sotillo', lat: 10.215, lng: -64.63 },
    ],
  },
  {
    label: 'Margarita', state: 'Nueva Esparta', count: 3, price: 0.9, generator: 0.85,
    zones: [{ name: 'Pampatar', municipality: 'Maneiro', lat: 10.995, lng: -63.8 }, { name: 'Porlamar', municipality: 'Mariño', lat: 10.957, lng: -63.85 }],
  },
  {
    label: 'Puerto Ordaz', state: 'Bolívar', count: 3, price: 0.6, generator: 0.8,
    zones: [{ name: 'Alta Vista', municipality: 'Caroní', lat: 8.29, lng: -62.72 }],
  },
  {
    label: 'San Cristobal', state: 'Táchira', count: 2, price: 0.45, generator: 0.6,
    zones: [{ name: 'Pueblo Nuevo', municipality: 'San Cristóbal', lat: 7.7669, lng: -72.225 }],
  },
];

/** Tipo -> [peso, precio base USD, habitaciones, banos, area base m2, nombre para el titulo] */
const TYPES: Array<{ type: DbSupport.PropertyType; weight: number; price: number; beds: [number, number]; baths: [number, number]; area: number; name: string }> = [
  { type: 'APARTAMENTO', weight: 50, price: 380, beds: [1, 4], baths: [1, 3], area: 85, name: 'Apartamento' },
  { type: 'CASA', weight: 16, price: 900, beds: [3, 6], baths: [2, 5], area: 220, name: 'Casa' },
  { type: 'TOWNHOUSE', weight: 8, price: 750, beds: [3, 4], baths: [2, 4], area: 160, name: 'Townhouse' },
  { type: 'HABITACION', weight: 8, price: 110, beds: [1, 1], baths: [1, 1], area: 18, name: 'Habitación amoblada' },
  { type: 'LOCAL', weight: 7, price: 600, beds: [0, 0], baths: [1, 2], area: 70, name: 'Local comercial' },
  { type: 'OFICINA', weight: 6, price: 520, beds: [0, 0], baths: [1, 2], area: 60, name: 'Oficina' },
  { type: 'GALPON', weight: 3, price: 1400, beds: [0, 0], baths: [1, 2], area: 450, name: 'Galpón' },
  { type: 'TERRENO', weight: 2, price: 700, beds: [0, 0], baths: [0, 0], area: 600, name: 'Terreno' },
];

const ADJETIVOS = ['luminoso', 'amplio', 'remodelado', 'acogedor', 'moderno', 'con excelente ubicación', 'recién pintado', 'con vista panorámica', 'tranquilo y seguro'];
const DESCRIPCIONES = [
  'Cerca de comercios, transporte y centros de salud. Ideal para familias o profesionales.',
  'Zona residencial segura con vigilancia. Excelente iluminación y ventilación natural.',
  'Acabados de calidad, cocina equipada y áreas bien distribuidas. Listo para mudarse.',
  'A pocos minutos de avenidas principales, colegios y centros comerciales.',
  'Edificio con buen mantenimiento y servicios de agua constantes gracias al tanque.',
];

// ---------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------

/** Generador pseudoaleatorio con semilla (mulberry32): los mismos datos en cada corrida. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(20261023);
const between = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
const chance = (p: number) => random() < p;
const round = (n: number, step: number) => Math.round(n / step) * step;

function pickType() {
  const total = TYPES.reduce((sum, t) => sum + t.weight, 0);
  let roll = random() * total;
  return TYPES.find((t) => (roll -= t.weight) < 0) ?? TYPES[0];
}

/** Juegos de fotos reales (prisma/seed-photos): 3 de apartamento y 2 de casa, de 3 fotos cada uno. */
const PHOTO_SETS = ['apto-1', 'apto-2', 'apto-3', 'casa-1', 'casa-2'];
const HOUSE_TYPES: string[] = ['CASA', 'TOWNHOUSE', 'GALPON', 'TERRENO'];

interface RenderedPhoto {
  original: Buffer;
  thumb: Buffer;
  medium: Buffer;
  hd: Buffer;
}
const photoCache = new Map<string, Promise<RenderedPhoto[]>>();

/** Procesa un juego una sola vez (original + thumb/medium/hd) y lo reutiliza en todas las propiedades. */
function loadPhotoSet(name: string) {
  let set = photoCache.get(name);
  if (!set) {
    set = Promise.all(
      ['a', 'b', 'c'].map(async (letter) => {
        const source = await readFile(join(__dirname, 'seed-photos', `${name}-${letter}.jpg`));
        return {
          original: await ImagesSupport.render(source, { format: 'jpeg', quality: 85 }),
          thumb: await ImagesSupport.render(source, { format: 'webp', quality: 70, size: { width: 300, height: 200, fit: 'cover' } }),
          medium: await ImagesSupport.render(source, { format: 'webp', quality: 75, size: { width: 800, height: 600 } }),
          hd: await ImagesSupport.render(source, { format: 'webp', quality: 80, size: { width: 1600, height: 1200 } }),
        };
      }),
    );
    photoCache.set(name, set);
  }
  return set;
}

/** Los apartamentos usan los juegos apto-*, las casas y similares los casa-*; se alternan segun el numero de propiedad. */
function photoSetFor(type: string, index: number) {
  const sets = PHOTO_SETS.filter((name) => name.startsWith(HOUSE_TYPES.includes(type) ? 'casa' : 'apto'));
  return sets[index % sets.length];
}

async function guardar(bucket: 'public' | 'private', key: string, data: Buffer) {
  const file = join(UPLOADS, bucket, key);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, data);
}

/** Copia las 3 fotos del juego a la propiedad (original privado + thumb/medium/hd publicas) con la misma estructura que la API. */
async function crearFotos(propertyId: string, setName: string) {
  const photos = await loadPhotoSet(setName);
  const rows: DbSupport.Prisma.PropertyImageCreateManyInput[] = [];
  for (const [i, photo] of photos.entries()) {
    const id = randomUUID();
    const base = `properties/${propertyId}`;
    const keys = {
      originalKey: `${base}/original/${id}.jpg`,
      thumbKey: `${base}/thumb/${id}.webp`,
      mediumKey: `${base}/medium/${id}.webp`,
      hdKey: `${base}/hd/${id}.webp`,
    };
    await guardar('private', keys.originalKey, photo.original);
    await guardar('public', keys.thumbKey, photo.thumb);
    await guardar('public', keys.mediumKey, photo.medium);
    await guardar('public', keys.hdKey, photo.hd);
    rows.push({ propertyId, ...keys, position: i, isCover: i === 0 });
  }
  return rows;
}

async function user(email: string, name: string, roles: DbSupport.Prisma.UserCreateInput['roles'], phone?: string) {
  return prisma.user.upsert({
    where: { emailHash: vault.emailHash(email) },
    update: {},
    create: {
      ...vault.encode({ email, name, phone }),
      roles,
      passwordHash: await PasswordSupport.hash(PASSWORD),
      emailVerifiedAt: new Date(),
    },
  });
}

// ---------------------------------------------------------------
// Principal
// ---------------------------------------------------------------

async function main() {
  const [, dueno, agenciaAdmin] = await Promise.all([
    user('admin@demo.local', 'Admin Demo', ['CLIENT', 'ADMIN']),
    user('dueno@demo.local', 'Carlos Dueño', ['CLIENT', 'OWNER'], '+584141112233'),
    user('agencia@demo.local', 'Agencia Demo', ['CLIENT', 'AGENCY'], '+584142223344'),
  ]);
  await user('cliente@demo.local', 'Cliente Demo', ['CLIENT'], '+584143334455');

  let agency = await prisma.agencyProfile.findFirst({ where: { members: { some: { userId: agenciaAdmin.id } } } });
  agency ??= await prisma.agencyProfile.create({
    data: {
      ...agencyVault.encodeProfile({ whatsapp: '+584141234567' }),
      name: 'Inmuebles Demo',
      description: 'Agencia de ejemplo para desarrollo.',
      maxProperties: 500,
      members: {
        create: {
          userId: agenciaAdmin.id,
          ...agencyVault.encodeMember({ invitedEmail: 'agencia@demo.local' }),
          role: 'AGENCY_ADMIN',
          invitationStatus: 'ACCEPTED',
        },
      },
    },
  });

  const demoOwners = { ownerUserId: { in: [dueno.id, agenciaAdmin.id] } };
  const existing = await prisma.property.count({ where: demoOwners });
  if (existing >= MIN_DEMO_PROPERTIES && !FRESH) {
    console.log(`Seed: ya hay ${existing} propiedades demo. Usa "pnpm db:seed -- --fresh" para regenerarlas.`);
    return;
  }

  // Regenerar: se borran las demo anteriores (y sus archivos) para no dejar basura.
  const previas = await prisma.propertyImage.findMany({ where: { property: demoOwners } });
  await Promise.all(previas.flatMap((i) => [rm(join(UPLOADS, 'private', i.originalKey), { force: true }), ...[i.thumbKey, i.mediumKey, i.hdKey].map((k) => rm(join(UPLOADS, 'public', k), { force: true }))]));
  await prisma.property.deleteMany({ where: demoOwners });

  let total = 0;
  for (const city of CITIES) {
    for (let n = 0; n < city.count * SCALE; n++) {
      const zone = city.zones[n % city.zones.length];
      const kind = pickType();
      const beds = between(...kind.beds);
      const baths = Math.max(between(...kind.baths), kind.baths[0]);
      const area = round(kind.area * (0.7 + random() * 0.9) + beds * 8, 5);

      // Precio en USD coherente con tipo, tamano y ciudad; ~1 de cada 10 se publica en bolivares.
      const usd = round(kind.price * city.price * (0.65 + random() * 0.8) + beds * 45, 10);
      const enBolivares = chance(0.1);
      const currency: DbSupport.Currency = enBolivares ? 'VES' : 'USD';
      const priceAmount = enBolivares ? round(usd * 38, 500) : usd;

      // 85% publicada, algunas reservadas, pocas alquiladas o pausadas
      const roll = random();
      const status: DbSupport.PropertyStatus = roll < 0.85 ? 'PUBLICADA' : roll < 0.93 ? 'RESERVADA' : roll < 0.97 ? 'ALQUILADA' : 'PAUSADA';

      const titulo = `${kind.name} ${pick(ADJETIVOS)} en ${zone.name}`;
      const deAgencia = n % 2 === 1;
      // Dispersion de ~300 m alrededor de la urbanizacion para que los pines no se encimen
      const latitude = Number((zone.lat + (random() - 0.5) * 0.006).toFixed(6));
      const longitude = Number((zone.lng + (random() - 0.5) * 0.006).toFixed(6));

      const property = await prisma.property.create({
        data: {
          title: titulo,
          description: `${titulo}, ${city.label} (${city.state}). ${pick(DESCRIPCIONES)} ${area} m² de construcción.`,
          type: kind.type,
          priceAmount,
          currency,
          bedrooms: beds,
          bathrooms: baths,
          parkingSpots: ['HABITACION', 'TERRENO'].includes(kind.type) ? 0 : between(0, 3),
          areaM2: area,
          furnished: chance(0.25),
          petsAllowed: chance(0.45),
          state: city.state,
          municipality: zone.municipality,
          urbanization: zone.name,
          address: `Calle ${between(1, 20)}, ${zone.name}`,
          latitude,
          longitude,
          hasGenerator: chance(city.generator),
          hasWaterTank: chance(0.8),
          hasFiberOptic: chance(0.55),
          hasSecurity: chance(0.6),
          ownerUserId: deAgencia ? agenciaAdmin.id : dueno.id,
          agencyId: deAgencia ? agency.id : null,
          status,
          publishedAt: new Date(Date.now() - between(0, 60) * 24 * 60 * 60 * 1000),
        },
      });
      if (WITH_IMAGES) {
        await prisma.propertyImage.createMany({ data: await crearFotos(property.id, photoSetFor(kind.type, total)) });
      }
      total++;
    }
  }
  console.log(`Seed listo: ${total} propiedades${WITH_IMAGES ? ' con 3 fotos reales cada una' : ' (sin fotos: STORAGE_PROVIDER no es local)'}.`);
  console.log(`Cuentas (clave ${PASSWORD}): admin@demo.local, dueno@demo.local, agencia@demo.local, cliente@demo.local`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
