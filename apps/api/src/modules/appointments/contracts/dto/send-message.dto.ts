import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Un mensaje de la conversacion. Quien lo escribe sale del token. */
export class SendMessageDto {
  @ApiProperty({ example: 'Hola, ¿el apartamento incluye estacionamiento?' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;
}
