import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Solo la app movil manda el refresh token en el body; la web lo manda en cookie httpOnly. */
export class RefreshDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  refreshToken?: string;
}
