import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import { CreateImageDto } from 'src/functionalities/images/dto'

export class PaymentDto {
  @ApiProperty({ type: String, example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa', description: 'Stripe Payment Intent Id.' })
  @IsOptional()
  paymentIntentId: string

  @ApiProperty({ type: String, example: '123456789', description: 'Bank transfer reference.' })
  @IsOptional()
  bankWireReference: string

  @ApiProperty({ type: String, example: false, description: 'Indicates payment type.' })
  @IsString()
  @IsEnum({
    TRANSFER: 'transfer',
    TDC: 'tdc',
  })
  paymentType: string

  @ApiProperty({ type: Boolean, example: false, description: 'Indicates if is an license payment or not.' })
  @IsString()
  isLicensePayment: boolean

  @ApiProperty({ type: String, description: 'Payment picture DTO', example: '{ base64, type }' })
  @IsObject()
  @IsOptional()
  createImageDto: CreateImageDto

  @ApiProperty({ type: String, example: false, description: 'Indicates status payment.' })
  @IsString()
  status: string

  @ApiProperty({ type: String, example: '646ae975732fecc4a485707d', description: 'Indicate company id.' })
  @IsString()
  companyId: string

  @ApiProperty({ type: String, example: '646ae975732fecc4a485707d', description: 'Indicate license id.' })
  @IsOptional()
  licenseId: string
}