import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Quien gestiona la propiedad ofrece de 1 a 5 fechas para la visita; el cliente acepta una. */
export class ProposeSlotsDto {
  @ApiProperty({ type: [String], example: ['2026-11-05T15:00:00.000Z', '2026-11-06T10:00:00.000Z'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsDateString({}, { each: true })
  slots: string[];

  @ApiPropertyOptional({ description: 'Mensaje que acompana las fechas' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}
