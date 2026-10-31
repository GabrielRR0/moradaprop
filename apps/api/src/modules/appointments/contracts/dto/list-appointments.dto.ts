import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { DbSupport } from '@/support/db';

/** Filtros y paginacion de "mis solicitudes" y "recibidas". */
export class ListAppointmentsDto {
  @ApiPropertyOptional({ enum: DbSupport.AppointmentStatus })
  @IsOptional()
  @IsEnum(DbSupport.AppointmentStatus)
  status?: DbSupport.AppointmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
}
