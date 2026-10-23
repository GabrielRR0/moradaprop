import sharp from 'sharp';
import type { Prisma } from '@prisma/client';
import type { TestApp } from './test-app';

/** Cuerpo valido para crear una propiedad por la API (Caracas, Chacao). */
export const propiedadValida = (overrides: Record<string, unknown> = {}) => ({
  title: 'Apartamento amplio en Los Palos Grandes',
  description: 'Apartamento de 3 habitaciones con excelente iluminacion, cerca del metro y comercios.',
  type: 'APARTAMENTO',
  priceAmount: 450,
  currency: 'USD',
  bedrooms: 3,
  bathrooms: 2,
  parkingSpots: 1,
  areaM2: 110,
  state: 'Miranda',
  municipality: 'Chacao',
  urbanization: 'Los Palos Grandes',
  latitude: 10.4969,
  longitude: -66.8477,
  hasGenerator: true,
  hasWaterTank: true,
  ...overrides,
});

/** Inserta una propiedad directo en la base (para preparar escenarios de busqueda sin pasar por la API). */
export async function seedProperty(t: TestApp, ownerUserId: string, overrides: Partial<Prisma.PropertyUncheckedCreateInput> = {}) {
  return t.prisma.property.create({
    data: {
      title: 'Propiedad de prueba',
      description: 'Descripcion de prueba lo bastante larga para el campo.',
      type: 'APARTAMENTO',
      priceAmount: 300,
      currency: 'USD',
      bedrooms: 2,
      bathrooms: 1,
      state: 'Miranda',
      municipality: 'Chacao',
      latitude: 10.49,
      longitude: -66.85,
      ownerUserId,
      status: 'PUBLICADA',
      publishedAt: new Date(),
      ...overrides,
    },
  });
}

/** Foto JPEG real (con colores) lista para subir. */
export const fotoJpeg = (width = 1200, height = 900) =>
  sharp({ create: { width, height, channels: 3, background: { r: 30, g: 120, b: 200 } } })
    .jpeg()
    .toBuffer();
