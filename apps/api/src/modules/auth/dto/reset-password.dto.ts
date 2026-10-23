import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../../../common/password';
import { EmailCodeDto } from './email-code.dto';

export class ResetPasswordDto extends EmailCodeDto {
  @ApiProperty({ example: 'NuevaClave123' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
