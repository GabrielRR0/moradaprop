import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { PasswordSupport } from '../../../support/password';
import { EmailCodeDto } from './email-code.dto';

export class ResetPasswordDto extends EmailCodeDto {
  @ApiProperty({ example: 'NuevaClave123' })
  @Matches(PasswordSupport.PATTERN, { message: PasswordSupport.MESSAGE })
  newPassword: string;
}
