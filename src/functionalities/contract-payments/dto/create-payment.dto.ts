import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsPositive, IsString, Min } from "class-validator";
import { CreateImageDto } from "src/functionalities/images/dto";

interface Geolocation {
  latitude: number
  longitude: number
}

export class CreatePaymentDto {

  @ApiProperty({ type: Number, description: 'Movement amount', example: 132 })
  @IsNumber()
  @Min(1)
  amount: number

  @ApiProperty({ type: String, description: 'Product picture DTO', example: '{ base64, type }' })
  @IsObject()
  @IsOptional()
  createImageDto: CreateImageDto

  @ApiProperty({ type: Object, description: 'Movement payment type', example: 'cash' })
  @IsString()
  @IsEnum({
    BANK: 'bank',
    CASH: 'cash',
  })
  paymentType: string

  @ApiProperty({ type: String, description: 'Contract ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  contract: string

  @ApiProperty({ type: Object, description: 'User latitude and longitude', example: '{ latitude, longitude }' })
  @IsObject()
  geolocation: Geolocation
  
  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  company: string

  @ApiProperty({ type: String, description: 'Movement description.', example: 'Payment of contract #' })
  @IsString()
  @IsOptional()
  description: string

  @ApiProperty({ type: String, description: 'Movement status.', example: 'validated' })
  @IsEnum({
    PENDING: 'pending',
    VALIDATED: 'validated',
  })
  @IsString()
  @IsOptional()
  status: string
  
  @ApiProperty({ type: String, description: 'Movement comment', example: '' })
  @IsString()
  @IsOptional()
  comment: string
  
  @ApiProperty({ type: String, description: 'Payment date. Format DD/MM/YYYY', example: '05/08/2023' })
  @IsString()
  @IsOptional()
  paymentDate: string
  
  @ApiProperty({ type: Number, description: 'Payment number', example: 3 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsOptional()
  paymentNumber: number
}
