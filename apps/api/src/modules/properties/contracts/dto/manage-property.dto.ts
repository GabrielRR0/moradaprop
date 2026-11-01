import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DbSupport } from '@/support/db';

export class ChangeStatusDto {
  @ApiProperty({ enum: DbSupport.PropertyStatus })
  @IsEnum(DbSupport.PropertyStatus)
  status: DbSupport.PropertyStatus;

  @ApiPropertyOptional({ description: 'Solo al reservar: false = reservada del todo (ya no se piden citas); true = reservada pero aun se pueden pedir.' })
  @IsOptional()
  @IsBoolean()
  acceptsVisits?: boolean;
}

export class AssignAgentDto {
  @ApiProperty({ description: 'Usuario (miembro de la agencia) que atendera esta propiedad' })
  @IsUUID()
  agentUserId: string;
}
