import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { DbSupport } from '../../../support/db';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** El cliente (clientId) sale del token; aqui solo va lo que el cliente decide. */
export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  propertyId: string;

  @ApiProperty({ enum: DbSupport.AppointmentType, description: 'VISITA pide una fecha; RESERVA aparta directo' })
  @IsEnum(DbSupport.AppointmentType)
  type: DbSupport.AppointmentType;

  @ApiPropertyOptional({ example: '2026-11-05T15:00:00.000Z', description: 'Obligatoria para VISITA' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({ description: 'Por defecto, el nombre de tu cuenta' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  contactName?: string;

  @ApiPropertyOptional({ example: '+584141234567', description: 'Por defecto, el telefono de tu cuenta' })
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Telefono invalido' })
  contactPhone?: string;

  @ApiPropertyOptional({ enum: DbSupport.ContactChannel, default: DbSupport.ContactChannel.WHATSAPP })
  @IsOptional()
  @IsEnum(DbSupport.ContactChannel)
  preferredChannel?: DbSupport.ContactChannel;
}

export class RespondAppointmentDto {
  @ApiProperty({ enum: ['CONFIRM', 'REJECT'] })
  @IsIn(['CONFIRM', 'REJECT'])
  action: 'CONFIRM' | 'REJECT';

  @ApiPropertyOptional({ description: 'Mensaje para el cliente' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}

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
