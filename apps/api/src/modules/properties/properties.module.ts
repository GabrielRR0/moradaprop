import { Module } from '@nestjs/common';
import { SecurityModule } from '@/modules/security';
import { PropertiesController } from './controllers/public/properties.controller';
import { PropertyFavoritesController } from './controllers/private/user/property-favorites.controller';
import { MyPropertiesController } from './controllers/private/publisher/my-properties.controller';
import { PropertyImagesController } from './controllers/private/publisher/property-images.controller';
import { PropertiesResolver } from './properties.resolver';
import { PropertiesService } from './services/properties.service';
import { PropertyAccessPolicy } from './services/property-access.policy';
import { PropertyFavoritesService } from './services/property-favorites.service';
import { PropertyImagesService } from './services/property-images.service';
import { PropertyPolicyService } from './services/property-policy.service';
import { PropertySearchService } from './services/property-search.service';
import { PropertyWriteService } from './services/property-write.service';

@Module({
  imports: [SecurityModule],
  // El orden importa: las rutas fijas (mine, favorites) se registran antes que GET ":id" del controller publico.
  controllers: [MyPropertiesController, PropertyImagesController, PropertyFavoritesController, PropertiesController],
  providers: [
    PropertiesService,
    PropertiesResolver,
    PropertySearchService,
    PropertyWriteService,
    PropertyImagesService,
    PropertyFavoritesService,
    PropertyPolicyService,
    PropertyAccessPolicy,
  ],
  exports: [PropertiesService, PropertyPolicyService],
})
export class PropertiesModule {}
