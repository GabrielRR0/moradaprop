import { PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

/** Mismos campos que al crear, todos opcionales. El estado se cambia por su propia ruta. */
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
