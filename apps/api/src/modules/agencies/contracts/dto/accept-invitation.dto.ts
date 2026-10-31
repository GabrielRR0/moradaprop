import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** La persona invitada acepta con el token del enlace que recibio por correo. */
export class AcceptInvitationDto {
  @ApiProperty({ description: 'Token recibido en el enlace del correo de invitacion' })
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  token: string;
}
