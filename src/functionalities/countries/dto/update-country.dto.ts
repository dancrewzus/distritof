import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCountryDto {
  
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
  
  @ApiProperty({ example: false, description: 'Indicates if is an active country or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
