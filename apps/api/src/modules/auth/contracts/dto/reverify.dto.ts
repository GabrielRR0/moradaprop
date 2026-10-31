import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { AuthenticationCredentialDto } from '@/modules/security';

/** Volver a comprobar el segundo factor con un codigo (app autenticadora o codigo de respaldo; nunca el del correo). */
export class ReverifyCodeDto {
  @ApiProperty({ example: '123456', description: 'Codigo TOTP o codigo de respaldo (xxxxx-xxxxx)' })
  @IsString()
  @MinLength(6)
  @MaxLength(11)
  code: string;
}

/** Volver a comprobar el segundo factor con una passkey. */
export class ReverifyPasskeyDto {
  @ApiProperty({ type: AuthenticationCredentialDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => AuthenticationCredentialDto)
  credential: AuthenticationCredentialDto;
}
