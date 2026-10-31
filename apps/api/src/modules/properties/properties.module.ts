import { Module } from '@nestjs/common';
import { SecurityModule } from '@/modules/security';
import { PropertiesController } from './controllers/public/properties.controller';
import { PropertyFavoritesController } from './controllers/private/user/property-favorites.controller';
import { MyPropertiesController } from './controllers/private/publisher/my-properties.controller';
import { PropertyImagesController } from './controllers/private/publisher/property-images.controller';
import { PropertiesResolver } from './properties.resolver';
import { PropertiesService } from './services/properties.service';
import { PropertyAccessPolicy } from './services/access/property-access.policy';
import { PropertyFavoritesService } from './services/favorites/property-favorites.service';
import { PropertyImagesService } from './services/images/property-images.service';
import { PropertyPolicyService } from './services/access/property-policy.service';
import { PropertyDetailService } from './services/catalog/property-detail.service';
import { PropertyMapService } from './services/catalog/property-map.service';
import { PropertyRentStatsService } from './services/catalog/property-rent-stats.service';
import { PropertySearchService } from './services/catalog/property-search.service';
import { PropertyMineService } from './services/management/property-mine.service';
import { PropertyWriteService } from './services/management/property-write.service';

@Module({
  imports: [SecurityModule],
  // El orden importa: las rutas fijas (mine, favorites) se registran antes que GET ":id" del controller publico.
  controllers: [MyPropertiesController, PropertyImagesController, PropertyFavoritesController, PropertiesController],
  providers: [
    PropertiesService,
    PropertiesResolver,
    // catalog/: lectura publica
    PropertySearchService,
    PropertyMapService,
    PropertyRentStatsService,
    PropertyDetailService,
    // management/: lo que hacen quienes publican
    PropertyMineService,
    PropertyWriteService,
    PropertyImagesService,
    PropertyFavoritesService,
    PropertyPolicyService,
    PropertyAccessPolicy,
  ],
  exports: [PropertiesService, PropertyPolicyService],
})
export class PropertiesModule {}
