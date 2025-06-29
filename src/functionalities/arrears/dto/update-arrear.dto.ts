import { PartialType } from '@nestjs/swagger';
import { CreateArrearDto } from './create-arrear.dto';

export class UpdateArrearDto extends PartialType(CreateArrearDto) {}
