import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { DbSupport } from '@/support/db';

export class ChangeStatusDto {
  @ApiProperty({ enum: DbSupport.PropertyStatus })
  @IsEnum(DbSupport.PropertyStatus)
  status: DbSupport.PropertyStatus;
}

export class AssignAgentDto {
  @ApiProperty({ description: 'Usuario (miembro de la agencia) que atendera esta propiedad' })
  @IsUUID()
  agentUserId: string;
}
