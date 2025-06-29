import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean } from 'class-validator'

export class UpdateTransferPaymentDto {
  @ApiProperty({ type: Boolean, example: true, description: 'Bank transfer reference.' })
  @IsBoolean()
  confirmPayment: boolean
}