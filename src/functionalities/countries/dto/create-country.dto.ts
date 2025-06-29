import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'


export class CreateCountryDto {
  
  @ApiProperty({ example: 'SCT', description: 'Country code.', type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(6)
  code: string
  
  @ApiProperty({ example: 'Scotland', description: 'Country name.', type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string
  
  @ApiProperty({ example: '+44', description: 'Country phone code.', type: String })
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  phoneCode: string
}

