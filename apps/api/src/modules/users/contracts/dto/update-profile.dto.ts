import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Solo campos que el usuario puede editar de si mismo. El id sale del token. */
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '+584141234567' })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Telefono invalido' })
  phone?: string;
}
