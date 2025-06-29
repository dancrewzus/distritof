import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { CreateNeighborhoodDto } from './create-neighborhood.dto';

export class UpdateNeighborhoodDto extends CreateNeighborhoodDto{
  
  @ApiProperty({ example: false, description: 'Indicates if is an active neighborhood or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
