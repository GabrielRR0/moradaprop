import { Module } from '@nestjs/common';
import { CdnHeaderLocator } from './cdn-header.locator';
import { GEO_LOCATOR } from './geo-locator';
import { GeoService } from './geo.service';

@Module({
  providers: [{ provide: GEO_LOCATOR, useClass: CdnHeaderLocator }, GeoService],
  exports: [GeoService],
})
export class GeoModule {}
