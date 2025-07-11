import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsString, Min } from 'class-validator'
import { CreateImageDto } from 'src/functionalities/images/dto/create-image.dto'

export class CreateContractDto {

  // client: string;
  // lastContract: string;
  // modality: string;
  // modalityOptions: string;
  // loanAmount: string;
  // percent: string;
  // payments: string;
  // totalAmount: string;
  // paymentAmount: string;
  // dailySunday: string;
  // dailyMonday: string;
  // dailyTuesday: string;
  // dailyWednesday: string;
  // dailyThursday: string;
  // dailyFriday: string;
  // dailySaturday: string;
  // weeklySunday: string;
  // weeklyMonday: string;
  // weeklyTuesday: string;
  // weeklyWednesday: string;
  // weeklyThursday: string;
  // weeklyFriday: string;
  // weeklySaturday: string;

  
  
  @ApiProperty({ type: String, description: 'Route ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  route: string
  
  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  company: string
  
  @ApiProperty({ type: String, description: 'Client ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  client: string
  
  @ApiProperty({ type: String, description: 'Worker ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  worker: string

  @ApiProperty({ type: String, description: 'Product picture DTO', example: '{ base64, type }' })
  @IsObject()
  createImageDto: CreateImageDto
  
  @ApiProperty({ type: String, description: 'Modality ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  modality: string

  @ApiProperty({ type: String, description: 'Last contract date', example: '01/01/1900' })
  @IsString()
  @IsOptional()
  lastContractDate?: string

  @ApiProperty({ type: Number, description: 'Loan amount', example: 120 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  loanAmount: number
  
  @ApiProperty({ type: Number, description: 'Loan percent', example: 10 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  percent: number
  
  @ApiProperty({ type: Number, description: 'Payments quantity', example: 20 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  paymentsQuantity: number

  @ApiProperty({ type: Number, description: 'Total amount', example: 132 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  totalAmount: number
  
  @ApiProperty({ type: Number, description: 'Payment amount', example: 6.6 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  paymentAmount: number

  @ApiProperty({ type: String, description: 'Non-working days', example: 'LuMaMiJuViSaDo' })
  @IsString()
  nonWorkingDays: string
}