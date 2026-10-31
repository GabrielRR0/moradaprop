import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Datos editables de la agencia. El plan (maxProperties, maxAgents) NO se puede editar aqui. */
export class UpdateAgencyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '+582121234567' })
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Telefono invalido' })
  phone?: string;

  @ApiPropertyOptional({ example: '+584141234567' })
  @IsOptional()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'WhatsApp invalido' })
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ example: 'J-12345678-9' })
  @IsOptional()
  @Matches(/^[JGVEPjgvep]-?\d{8}-?\d$/, { message: 'RIF invalido (ej. J-12345678-9)' })
  rif?: string;
}
