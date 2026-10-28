import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { DbSupport } from '../../../support/db';

registerEnumType(DbSupport.PropertyType, { name: 'PropertyType' });
registerEnumType(DbSupport.PropertyStatus, { name: 'PropertyStatus' });
registerEnumType(DbSupport.Currency, { name: 'Currency' });

/**
 * Tipos de lectura de GraphQL. Son una VENTANA de lo publico: aqui no existen ownerUserId, agencyId,
 * assignedAgentId ni claves de storage, asi que ni siquiera se pueden pedir.
 */
@ObjectType('PropertyImage')
export class PropertyImageType {
  @Field() id: string;
  @Field() isCover: boolean;
  @Field(() => Int) position: number;
  @Field() thumb: string;
  @Field() medium: string;
  @Field() hd: string;
}

@ObjectType('PropertyCard')
export class PropertyCardType {
  @Field() id: string;
  @Field() title: string;
  @Field(() => DbSupport.PropertyType) type: DbSupport.PropertyType;
  @Field(() => DbSupport.PropertyStatus) status: DbSupport.PropertyStatus;
  /** true cuando esta "En Proceso de Reserva" */
  @Field() inReservation: boolean;
  @Field(() => Float) priceAmount: number;
  @Field(() => DbSupport.Currency) currency: DbSupport.Currency;
  @Field(() => Int) bedrooms: number;
  @Field(() => Int) bathrooms: number;
  @Field(() => Int) parkingSpots: number;
  @Field(() => Float, { nullable: true }) areaM2?: number | null;
  @Field() state: string;
  @Field() municipality: string;
  @Field(() => String, { nullable: true }) urbanization?: string | null;
  @Field(() => Float) latitude: number;
  @Field(() => Float) longitude: number;
  @Field() hasGenerator: boolean;
  @Field() hasWaterTank: boolean;
  @Field() hasFiberOptic: boolean;
  @Field() hasSecurity: boolean;
  @Field(() => PropertyImageType, { nullable: true }) cover?: PropertyImageType | null;
  @Field(() => Date, { nullable: true }) publishedAt?: Date | null;
}

@ObjectType('PropertyPage')
export class PropertyPageType {
  @Field(() => [PropertyCardType]) items: PropertyCardType[];
  @Field(() => Int) total: number;
  @Field(() => Int) page: number;
  @Field(() => Int) limit: number;
}

@ObjectType('PublishedBy')
export class PublishedByType {
  @Field() type: string;
  @Field() id: string;
  @Field() name: string;
  @Field(() => String, { nullable: true }) logoUrl?: string | null;
}

@ObjectType('PropertyDetail')
export class PropertyDetailType extends PropertyCardType {
  @Field() description: string;
  @Field(() => String, { nullable: true }) address?: string | null;
  @Field() furnished: boolean;
  @Field() petsAllowed: boolean;
  @Field(() => [PropertyImageType]) images: PropertyImageType[];
  @Field(() => PublishedByType) publishedBy: PublishedByType;
  @Field() isFavorite: boolean;
  @Field() canManage: boolean;
  @Field(() => Date) createdAt: Date;
  @Field(() => Date) updatedAt: Date;
}

/** Pin del mapa: un punto suelto (propertyId) o un grupo (count > 1). */
@ObjectType('MapMarker')
export class MapMarkerType {
  @Field() kind: string;
  @Field(() => Float) latitude: number;
  @Field(() => Float) longitude: number;
  @Field(() => Int, { nullable: true }) count?: number;
  @Field(() => Float, { nullable: true }) minPrice?: number;
  @Field(() => [String], { nullable: true }) ids?: string[];
  @Field(() => String, { nullable: true }) propertyId?: string;
  @Field(() => Float, { nullable: true }) priceAmount?: number;
  @Field(() => DbSupport.Currency, { nullable: true }) currency?: DbSupport.Currency;
  @Field(() => DbSupport.PropertyStatus, { nullable: true }) status?: DbSupport.PropertyStatus;
}

@ObjectType('PropertyMap')
export class PropertyMapType {
  @Field(() => Int) zoom: number;
  @Field(() => Int) total: number;
  @Field() truncated: boolean;
  @Field(() => [MapMarkerType]) markers: MapMarkerType[];
}
