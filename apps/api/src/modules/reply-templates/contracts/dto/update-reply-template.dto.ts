import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Cambios a un texto reutilizable: solo lo que se envía se modifica. */
export class UpdateReplyTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body?: string;

  @ApiPropertyOptional({ description: 'Compartir con el equipo de tu inmobiliaria (true) o dejarlo solo para su autor (false)' })
  @IsOptional()
  @IsBoolean()
  shared?: boolean;
}
