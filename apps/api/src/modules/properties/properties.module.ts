import { Module } from '@nestjs/common';
import { SecurityModule } from '../security';
import { PropertiesController } from './properties.controller';
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
  controllers: [PropertiesController],
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
