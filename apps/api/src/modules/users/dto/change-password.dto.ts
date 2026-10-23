import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../../../common/password';

export class ChangePasswordDto {
  @ApiPropertyOptional({ description: 'Obligatoria si la cuenta ya tiene contrasena (no si se creo solo con Google)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;

  @ApiProperty({ example: 'NuevaClave123' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
