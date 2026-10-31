import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DbSupport } from '@/support/db';

/** Los query params llegan como texto: "true" / "false" -> boolean. */
const toBoolean = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

/** Tope de paginas: evita que alguien pida page=100000 y obligue a la base a recorrer miles de filas. */
export const MAX_PAGE = 50;

export enum PropertySort {
  RECENT = 'recent',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

/** Filtros compartidos por el listado y el mapa. */
export class PropertyFiltersDto {
  @ApiPropertyOptional({ description: 'Busca en titulo, descripcion y urbanizacion' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) municipality?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) urbanization?: string;

  @ApiPropertyOptional({ enum: DbSupport.PropertyType })
  @IsOptional()
  @IsEnum(DbSupport.PropertyType)
  type?: DbSupport.PropertyType;

  @ApiPropertyOptional({ enum: DbSupport.Currency, description: 'Moneda de minPrice/maxPrice (USD por defecto)' })
  @IsOptional()
  @IsEnum(DbSupport.Currency)
  currency?: DbSupport.Currency;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimo de habitaciones' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Minimo de banos' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20)
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Minimo de puestos de estacionamiento' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20)
  parkingSpots?: number;

  @ApiPropertyOptional({ description: 'Planta electrica' })
  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasGenerator?: boolean;

  @ApiPropertyOptional({ description: 'Tanque de agua / hidroneumatico' })
  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasWaterTank?: boolean;

  @ApiPropertyOptional({ description: 'Fibra optica' })
  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasFiberOptic?: boolean;

  @ApiPropertyOptional({ description: 'Vigilancia' })
  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasSecurity?: boolean;

  // Caja del mapa (esquina suroeste y noreste)
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) swLat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) swLng?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90) neLat?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180) neLng?: number;
}

export class SearchPropertiesDto extends PropertyFiltersDto {
  @ApiPropertyOptional({ enum: PropertySort, default: PropertySort.RECENT })
  @IsOptional()
  @IsEnum(PropertySort)
  sort?: PropertySort;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(MAX_PAGE) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}

/** Mapa: mismos filtros + nivel de zoom para decidir cuanto agrupar. */
export class MapPropertiesDto extends PropertyFiltersDto {
  @ApiPropertyOptional({ description: 'Zoom del mapa (1-20)', default: 10 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20)
  zoom?: number;
}
