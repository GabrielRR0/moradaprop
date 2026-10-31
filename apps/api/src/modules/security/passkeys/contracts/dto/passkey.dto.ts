import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, Equals, IsArray, IsDefined, IsInt, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

/**
 * Lo que manda el navegador (`credential.toJSON()`). El ValidationPipe rechaza campos desconocidos, asi que aqui
 * estan TODOS los que envian los navegadores; los extras opcionales se aceptan y se ignoran. Solo base64url y con tope.
 */
const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/; // sin relleno por especificacion; se tolera el relleno de clientes hechos a mano
const B64_MESSAGE = 'Debe ser base64url';

export class RegistrationResponseDto {
  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(6000)
  clientDataJSON: string;

  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(22_000)
  attestationObject: string;

  @ApiPropertyOptional() @IsOptional() @IsArray() @ArrayMaxSize(8) @IsString({ each: true }) @MaxLength(20, { each: true })
  transports?: string[];

  // Extras que agregan los navegadores recientes: se aceptan y se ignoran (todo sale de attestationObject, que va firmado).
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(22_000)
  authenticatorData?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  publicKey?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  publicKeyAlgorithm?: number;
}

export class RegistrationCredentialDto {
  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(1400)
  id: string;

  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(1400)
  rawId: string;

  @ApiProperty({ example: 'public-key' }) @IsString() @Equals('public-key')
  type: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  authenticatorAttachment?: string;

  @ApiPropertyOptional() @IsOptional() @IsObject()
  clientExtensionResults?: Record<string, unknown>;

  @ApiProperty({ type: RegistrationResponseDto }) @IsDefined() @ValidateNested() @Type(() => RegistrationResponseDto)
  response: RegistrationResponseDto;
}

export class AuthenticationResponseDto {
  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(6000)
  clientDataJSON: string;

  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(6000)
  authenticatorData: string;

  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(1400)
  signature: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(200)
  userHandle?: string | null;
}

export class AuthenticationCredentialDto {
  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(1400)
  id: string;

  @ApiProperty() @IsString() @Matches(BASE64URL, { message: B64_MESSAGE }) @MaxLength(1400)
  rawId: string;

  @ApiProperty({ example: 'public-key' }) @IsString() @Equals('public-key')
  type: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30)
  authenticatorAttachment?: string;

  @ApiPropertyOptional() @IsOptional() @IsObject()
  clientExtensionResults?: Record<string, unknown>;

  @ApiProperty({ type: AuthenticationResponseDto }) @IsDefined() @ValidateNested() @Type(() => AuthenticationResponseDto)
  response: AuthenticationResponseDto;
}

/** Empezar a registrar una passkey: pide la contrasena otra vez (si la cuenta tiene). */
export class RegisterOptionsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(128)
  password?: string;
}

export class FinishRegistrationDto {
  @ApiProperty({ type: RegistrationCredentialDto }) @IsDefined() @ValidateNested() @Type(() => RegistrationCredentialDto)
  credential: RegistrationCredentialDto;

  @ApiPropertyOptional({ example: 'Mi iPhone' }) @IsOptional() @IsString() @MaxLength(60)
  label?: string;
}

export class RenamePasskeyDto {
  @ApiProperty({ example: 'Mi laptop' }) @IsString() @MinLength(1) @MaxLength(60)
  label: string;
}

/** Entrar con passkey (sin contrasena). */
export class PasskeyLoginDto {
  @ApiProperty({ type: AuthenticationCredentialDto }) @IsDefined() @ValidateNested() @Type(() => AuthenticationCredentialDto)
  credential: AuthenticationCredentialDto;
}

/** Segundo paso del login con passkey: va con el challengeToken que entrego /auth/login. */
export class PasskeyStepUpOptionsDto {
  @ApiProperty() @IsString() @MaxLength(2000)
  challengeToken: string;
}

export class PasskeyStepUpVerifyDto extends PasskeyStepUpOptionsDto {
  @ApiProperty({ type: AuthenticationCredentialDto }) @IsDefined() @ValidateNested() @Type(() => AuthenticationCredentialDto)
  credential: AuthenticationCredentialDto;
}
