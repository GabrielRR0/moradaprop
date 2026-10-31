import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** Valor nuevo de un ajuste. Que sea valido para esa clave lo comprueba el registro (registry/setting-keys.ts). */
export class SetSettingDto {
  @ApiProperty({ example: 'no-reply@midominio.com' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  value: string;
}
