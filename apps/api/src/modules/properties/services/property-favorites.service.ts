import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';
import { STORAGE_PROVIDER, type StorageProvider } from '../../../common/storage';
import { cardInclude, toCard } from '../utils/property-mapper';

@Injectable()
export class PropertyFavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async add(userId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, status: { not: PropertyStatus.PAUSADA } },
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

  async remove(userId: string, propertyId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, propertyId } });
    return { favorite: false };
  }

  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId, property: { status: { not: PropertyStatus.PAUSADA } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { property: { include: cardInclude } },
    });
    return favorites.map((f) => toCard(f.property, this.storage));
  }
}
