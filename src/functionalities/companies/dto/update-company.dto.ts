import { ApiProperty } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends CreateCompanyDto {
  
  @ApiProperty({ example: false, description: 'Indicates if is an active company or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
  
  @ApiProperty({ example: false, description: 'Indicates if is an active company or not.', type: String })
  @IsString()
  @IsOptional()
  onboardingSteps?: string
}
