import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Un texto reutilizable nuevo. El autor sale del token. */
export class CreateReplyTemplateDto {
  @ApiProperty({ example: 'Sigue disponible' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title: string;

  @ApiProperty({ example: 'Hola {nombre}, sí, {propiedad} sigue disponible. ¿Te gustaría coordinar una visita?' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({ description: 'true = lo ve todo el equipo de tu inmobiliaria; false o sin enviar = solo tú' })
  @IsOptional()
  @IsBoolean()
  shared?: boolean;
}
