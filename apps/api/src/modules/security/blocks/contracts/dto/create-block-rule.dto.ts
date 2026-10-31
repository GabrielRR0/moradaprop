import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DbSupport } from '@/support/db';

export class CreateBlockRuleDto {
  @ApiProperty({ enum: DbSupport.BlockType })
  @IsEnum(DbSupport.BlockType)
  type: DbSupport.BlockType;

  @ApiProperty({ example: '190.120.0.0/16', description: 'IP, CIDR, pais (VE), userId, correo o dominio' })
  @IsString()
  @MaxLength(255)
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Si se omite, el bloqueo no vence' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
