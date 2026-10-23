import { ApiProperty } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class ChangeStatusDto {
  @ApiProperty({ enum: PropertyStatus })
  @IsEnum(PropertyStatus)
  status: PropertyStatus;
}

export class AssignAgentDto {
  @ApiProperty({ description: 'Usuario (miembro de la agencia) que atendera esta propiedad' })
  @IsUUID()
  agentUserId: string;
}
