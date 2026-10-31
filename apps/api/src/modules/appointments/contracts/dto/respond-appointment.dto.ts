import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Quien gestiona la propiedad confirma o rechaza la solicitud. */
export class RespondAppointmentDto {
  @ApiProperty({ enum: ['CONFIRM', 'REJECT'] })
  @IsIn(['CONFIRM', 'REJECT'])
  action: 'CONFIRM' | 'REJECT';

  @ApiPropertyOptional({ description: 'Mensaje para el cliente' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}
