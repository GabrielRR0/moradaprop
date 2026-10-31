import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { DbSupport } from '@/support/db';

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
