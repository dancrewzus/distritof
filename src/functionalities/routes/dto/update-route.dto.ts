import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { CreateRouteDto } from './create-route.dto';

export class UpdateRouteDto extends CreateRouteDto{
  
  @ApiProperty({ example: false, description: 'Indicates if is an active route or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
