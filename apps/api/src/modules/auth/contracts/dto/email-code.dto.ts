import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Solo el correo (reenviar codigo, olvide mi contrasena). */
export class EmailDto {
  @ApiProperty()
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;
}

/** Correo + codigo de 6 digitos (verificar correo). */
export class EmailCodeDto extends EmailDto {
  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'El codigo tiene 6 digitos' })
  code: string;
}
