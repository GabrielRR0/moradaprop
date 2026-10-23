import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesResolver } from './properties.resolver';
import { PropertiesService } from './services/properties.service';
import { PropertyFavoritesService } from './services/property-favorites.service';
import { PropertyImagesService } from './services/property-images.service';
import { PropertyPolicyService } from './services/property-policy.service';
import { PropertySearchService } from './services/property-search.service';
import { PropertyWriteService } from './services/property-write.service';

@Module({
  controllers: [PropertiesController],
  providers: [
    PropertiesService,
    PropertiesResolver,
    PropertySearchService,
    PropertyWriteService,
    PropertyImagesService,
    PropertyFavoritesService,
    PropertyPolicyService,
  ],
  exports: [PropertiesService, PropertyPolicyService],
})
export class PropertiesModule {}
