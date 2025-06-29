import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'


export class CreateCityDto {
  
  
  @ApiProperty({ example: 'Dundee', description: 'City name.', type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string
  
  @ApiProperty({ example: 'wf21ef1e321gf65r1', description: 'City company owner ID.', type: String })
  @IsString()
  company: string
  
  @ApiProperty({ example: 'Scotland', description: 'City country ID.', type: String })
  @IsString()
  country: string
}

