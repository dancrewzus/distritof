import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateLicenseDto {
  
  @ApiProperty({ example: 'LIC001', description: 'License code.' })
  @IsString()
  @MinLength(3)
  @MaxLength(6)
  code: string
  
  @ApiProperty({ example: 'Premium', description: 'License name.' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string

  @ApiProperty({ example: 1825, description: 'License days.', type: Number })
  @IsNumber()
  @IsPositive()
  days: number;

  @ApiProperty({ example: 200, description: 'License price.', type: Number })
  @IsNumber()
  @IsPositive()
  price: number;
  
  @ApiProperty({ example: '65s4f65e65f49r1', description: 'License currency ID.' })
  @IsString()
  currency: string

  @ApiProperty({ example: false, description: 'Indicates if is an active license or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
