import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { CreatePendingDto } from './create-pending.dto';

export class UpdatePendingDto extends CreatePendingDto {
  
  @ApiProperty({ example: 'You are selected for Howarts School', description: 'Note description.', type: String })
  @IsString()
  description: string
}
