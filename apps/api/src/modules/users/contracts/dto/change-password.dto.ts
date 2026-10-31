import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PasswordSupport } from '@/support/password';

export class ChangePasswordDto {
  @ApiPropertyOptional({ description: 'Obligatoria si la cuenta ya tiene contrasena (no si se creo solo con Google)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;

  @ApiProperty({ example: 'NuevaClave123' })
  @Matches(PasswordSupport.PATTERN, { message: PasswordSupport.MESSAGE })
  newPassword: string;
}
