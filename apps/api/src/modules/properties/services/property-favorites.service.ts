import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { cardInclude, toCard } from '../utils/property-mapper';
import { DbSupport } from '@/support/db';
import type { FavoriteResource, PropertyCardResource } from '../contracts/resources';

@Injectable()
export class PropertyFavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async add(userId: string, propertyId: string): Promise<FavoriteResource> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: { not: DbSupport.PropertyStatus.PAUSADA } },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    await this.prisma.favorite.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId },
      update: {},
    });
    return { favorite: true };
  }

  async remove(userId: string, propertyId: string): Promise<FavoriteResource> {
    await this.prisma.favorite.deleteMany({ where: { userId, propertyId } });
    return { favorite: false };
  }

  async list(userId: string): Promise<PropertyCardResource[]> {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId, property: { status: { not: DbSupport.PropertyStatus.PAUSADA } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { property: { include: cardInclude } },
    });
    return favorites.map((f) => toCard(f.property, this.storage));
  }
}
