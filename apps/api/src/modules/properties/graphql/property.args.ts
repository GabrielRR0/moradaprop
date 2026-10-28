import { ArgsType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_PAGE, PropertySort } from '../dto/search-properties.dto';
import { DbSupport } from '../../../support/db';

registerEnumType(PropertySort, { name: 'PropertySort' });

/**
 * Argumentos de busqueda en GraphQL. Mismos filtros y mismas reglas que el REST (PropertyFiltersDto);
 * el ValidationPipe global los valida igual: rangos, tope de paginacion y campos desconocidos.
 */
@ArgsType()
export class PropertyFiltersArgs {
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(100) q?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(60) state?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(80) municipality?: string;
  @Field({ nullable: true }) @IsOptional() @IsString() @MaxLength(100) urbanization?: string;
  @Field(() => DbSupport.PropertyType, { nullable: true }) @IsOptional() @IsEnum(DbSupport.PropertyType) type?: DbSupport.PropertyType;
  @Field(() => DbSupport.Currency, { nullable: true }) @IsOptional() @IsEnum(DbSupport.Currency) currency?: DbSupport.Currency;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(0) minPrice?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(0) maxPrice?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(20) bedrooms?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(20) bathrooms?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(0) @Max(20) parkingSpots?: number;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() hasGenerator?: boolean;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() hasWaterTank?: boolean;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() hasFiberOptic?: boolean;
  @Field({ nullable: true }) @IsOptional() @IsBoolean() hasSecurity?: boolean;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(-90) @Max(90) swLat?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(-180) @Max(180) swLng?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(-90) @Max(90) neLat?: number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(-180) @Max(180) neLng?: number;
}

@ArgsType()
export class SearchPropertiesArgs extends PropertyFiltersArgs {
  @Field(() => PropertySort, { nullable: true }) @IsOptional() @IsEnum(PropertySort) sort?: PropertySort;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(MAX_PAGE) page?: number;
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(50) limit?: number;
}

@ArgsType()
export class MapPropertiesArgs extends PropertyFiltersArgs {
  @Field(() => Int, { nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(20) zoom?: number;
}
