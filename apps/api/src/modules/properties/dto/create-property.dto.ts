import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DbSupport } from '../../../support/db';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Caja que contiene a Venezuela: descarta coordenadas absurdas antes de guardarlas. */
export const VE_LAT = { min: 0.5, max: 12.5 };
export const VE_LNG = { min: -73.5, max: -59.5 };

/**
 * Datos que el usuario puede enviar al publicar. NO existen aqui (y por eso el ValidationPipe
 * los rechaza si llegan): ownerUserId, agencyId, assignedAgentId, status, publishedAt.
 */
export class CreatePropertyDto {
  @ApiProperty({ example: 'Apartamento en Los Palos Grandes' })
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: DbSupport.PropertyType })
  @IsEnum(DbSupport.PropertyType)
  type: DbSupport.PropertyType;

  @ApiProperty({ example: 450 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000_000)
  priceAmount: number;

  @ApiPropertyOptional({ enum: DbSupport.Currency, default: DbSupport.Currency.USD })
  @IsOptional()
  @IsEnum(DbSupport.Currency)
  currency?: DbSupport.Currency;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  parkingSpots?: number;

  @ApiPropertyOptional({ example: 85.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(1_000_000)
  areaM2?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  // Ubicacion
  @ApiProperty({ example: 'Miranda' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  state: string;

  @ApiProperty({ example: 'Chacao' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  municipality: string;

  @ApiPropertyOptional({ example: 'Los Palos Grandes' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  urbanization?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ example: 10.4969 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(VE_LAT.min)
  @Max(VE_LAT.max)
  latitude: number;

  @ApiProperty({ example: -66.8477 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 7 })
  @Min(VE_LNG.min)
  @Max(VE_LNG.max)
  longitude: number;

  // Amenities locales
  @ApiPropertyOptional({ description: 'Planta electrica' })
  @IsOptional()
  @IsBoolean()
  hasGenerator?: boolean;

  @ApiPropertyOptional({ description: 'Tanque de agua / hidroneumatico' })
  @IsOptional()
  @IsBoolean()
  hasWaterTank?: boolean;

  @ApiPropertyOptional({ description: 'Fibra optica' })
  @IsOptional()
  @IsBoolean()
  hasFiberOptic?: boolean;

  @ApiPropertyOptional({ description: 'Vigilancia' })
  @IsOptional()
  @IsBoolean()
  hasSecurity?: boolean;
}
