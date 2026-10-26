import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlockType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlockRuleDto {
  @ApiProperty({ enum: BlockType })
  @IsEnum(BlockType)
  type: BlockType;

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
