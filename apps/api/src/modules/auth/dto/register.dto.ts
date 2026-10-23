import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../../../common/password';

/** Tipos de cuenta que se pueden elegir al registrarse. ADMIN nunca se crea desde aqui. */
export enum AccountType {
  CLIENT = 'CLIENT',
  OWNER = 'OWNER',
  AGENCY = 'AGENCY',
}

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @ApiProperty({ example: 'maria@correo.com' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Clave1234' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({ example: 'Maria Perez' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '+584141234567' })
  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Telefono invalido' })
  phone?: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiPropertyOptional({ description: 'Obligatorio si accountType es AGENCY' })
  @ValidateIf((dto: RegisterDto) => dto.accountType === AccountType.AGENCY)
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  agencyName?: string;
}
