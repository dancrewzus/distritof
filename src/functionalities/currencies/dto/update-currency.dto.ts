import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCurrencyDto {
  
  @ApiProperty({ example: 'USD', description: 'Currency code.', type: String })
  @IsString()
  @MinLength(3)
  @MaxLength(6)
  code: string
  
  @ApiProperty({ example: 'American dollar', description: 'Currency name.', type: String })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string
  
  @ApiProperty({ example: 2, description: 'Currency decimals.', type: Number })
  @IsNumber()
  @Min(0)
  @Max(2)
  decimals: number;
  
  @ApiProperty({ example: false, description: 'Indicates if is an active currency or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
  
  @ApiProperty({ example: false, description: 'Indicates if is this the primary currency of the system or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean
}
