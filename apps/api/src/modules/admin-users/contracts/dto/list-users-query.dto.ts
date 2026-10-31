import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { DbSupport } from '@/support/db';

/** Busqueda y paginacion del listado de usuarios. */
export class ListUsersQueryDto {
  @ApiPropertyOptional({ description: 'Busca por nombre o correo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: DbSupport.UserStatus })
  @IsOptional()
  @IsEnum(DbSupport.UserStatus)
  status?: DbSupport.UserStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
