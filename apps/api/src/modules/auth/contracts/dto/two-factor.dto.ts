import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Segundo paso del login. */
export class TwoFactorLoginDto {
  @ApiProperty({ description: 'challengeToken recibido en /auth/login' })
  @IsString()
  @MaxLength(2000)
  challengeToken: string;

  @ApiProperty({ example: '123456', description: 'Codigo TOTP, codigo de respaldo (xxxxx-xxxxx) o codigo por correo' })
  @IsString()
  @MinLength(6)
  @MaxLength(11)
  code: string;
}

export class TwoFactorChallengeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  challengeToken: string;
}

/** Activar 2FA: confirma con el primer codigo de la app. */
export class TwoFactorConfirmDto {
  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'El codigo tiene 6 digitos' })
  code: string;
}

/** Desactivar 2FA o regenerar codigos de respaldo: pide contrasena (si la tiene) y un codigo. */
export class TwoFactorDisableDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(11)
  code: string;
}
