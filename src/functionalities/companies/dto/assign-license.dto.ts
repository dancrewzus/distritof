import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
} from 'class-validator';

export class AssignLicenseDto {
  
  @ApiProperty({ example: '56s46f46ds15f', description: 'Company id.', type: String })
  @IsString()
  companyId: string
  
  @ApiProperty({ example: '68e32f165e1f31', description: 'License id.', type: String })
  @IsString()
  licenseId: string
  
  @ApiProperty({ example: '68e32f165e1f31', description: 'Payment id.', type: String })
  @IsString()
  paymentId: string
}
