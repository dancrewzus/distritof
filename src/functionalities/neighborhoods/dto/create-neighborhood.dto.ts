import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'


export class CreateNeighborhoodDto {
  
  
  @ApiProperty({ example: 'Hilltown', description: 'Neighborhood name.', type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string
  
  @ApiProperty({ example: 'wf21ef1e321gf65r1', description: 'Neighborhood company owner ID.', type: String })
  @IsString()
  company: string
  
  @ApiProperty({ example: 'Dundee', description: 'Neighborhood city ID.', type: String })
  @IsString()
  city: string
}

