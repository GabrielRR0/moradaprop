import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/** Bloquear la IP de un evento del visor de auditoria (el admin no escribe la IP: sale del registro). */
export class BlockIpFromLogDto {
  @ApiProperty({ description: 'id del evento de auditoria cuya IP se bloquea' })
  @IsUUID()
  auditLogId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Horas que dura el bloqueo. Si se omite, no vence', example: 72 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8760)
  hours?: number;
}
