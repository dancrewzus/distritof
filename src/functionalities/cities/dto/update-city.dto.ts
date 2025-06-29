import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { CreateCityDto } from './create-city.dto';

export class UpdateCityDto extends CreateCityDto{
  
  @ApiProperty({ example: false, description: 'Indicates if is an active city or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
