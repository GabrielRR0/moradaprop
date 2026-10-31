import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DbSupport } from '@/support/db';

/** Suspende o reactiva una cuenta. */
export class SetUserStatusDto {
  @ApiProperty({ enum: DbSupport.UserStatus })
  @IsEnum(DbSupport.UserStatus)
  status: DbSupport.UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
