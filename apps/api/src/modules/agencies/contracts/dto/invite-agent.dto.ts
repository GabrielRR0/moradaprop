import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** El administrador de la agencia invita a un agente por correo. */
export class InviteAgentDto {
  @ApiProperty({ example: 'agente@inmobiliaria.com' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;
}
