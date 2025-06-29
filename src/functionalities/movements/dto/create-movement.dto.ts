import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";
import { CreateImageDto } from "src/functionalities/images/dto";

export class CreateMovementDto {
  
  @ApiProperty({ type: String, description: 'Movement validated by ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  @IsOptional()
  validatedBy: string
  
  @ApiProperty({ type: String, description: 'Contract ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  @IsOptional()
  contract: string

  @ApiProperty({ type: String, description: 'Route ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  @IsOptional()
  route: string
  
  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @IsString()
  company: string
  
  @ApiProperty({ type: String, description: 'Product picture DTO', example: '{ base64, type }' })
  @IsObject()
  @IsOptional()
  createImageDto: CreateImageDto
  
  @ApiProperty({ type: Number, description: 'Movement amount', example: 132 })
  @IsNumber()
  @Min(0)
  amount: number
  
  @ApiProperty({ type: String, description: 'Movement type', example: 'in' })
  @IsEnum({
    IN: 'in',
    OUT: 'out',
    FINAL: 'final',
  })
  @IsString()
  type: string

  @ApiProperty({ type: String, description: 'Movement description.', example: 'Payment of contract #' })
  @IsString()
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

  @ApiProperty({ type: String, description: 'Movement payment type', example: 'cash' })
  @IsString()
  @IsOptional()
  paymentType: string
}
