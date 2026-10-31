import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

/** El front obtiene el idToken con Google Identity Services y lo manda aqui. */
export class GoogleTokenDto {
  @ApiProperty({ description: 'idToken (JWT) entregado por Google' })
  @IsString()
  @MaxLength(4096)
  idToken: string;
}

/** Confirma la vinculacion de Google con una cuenta existente. */
export class GoogleLinkConfirmDto extends GoogleTokenDto {
  @ApiProperty({ example: '123456', description: 'Codigo enviado al correo de la cuenta' })
  @Matches(/^\d{6}$/, { message: 'El codigo tiene 6 digitos' })
  code: string;
}
