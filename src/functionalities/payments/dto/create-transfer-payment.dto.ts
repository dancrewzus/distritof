import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator'
import { CreateImageDto } from 'src/functionalities/images/dto'

export class CreateTransferPaymentDto {
  @ApiProperty({ type: String, example: '123456789', description: 'Bank transfer reference.' })
  @IsString()
  bankWireReference: string

  @ApiProperty({ type: Boolean, example: false, description: 'Indicates if is an license payment or not.' })
  @IsBoolean()
  isLicensePayment: boolean

  @ApiProperty({ type: String, description: 'Payment picture DTO', example: '{ base64, type }' })
  @IsObject()
  @IsOptional()
  createImageDto: CreateImageDto

  @ApiProperty({ type: String, example: '646ae975732fecc4a485707d', description: 'Indicate license id.' })
  @IsString()
  licenseId: string

  @ApiProperty({ type: String, example: '646ae975732fecc4a485707d', description: 'Indicate company id.' })
  @IsString()
  companyId: string
}