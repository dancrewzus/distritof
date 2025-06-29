import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateTDCPaymentDto {
  @ApiProperty({ type: String, example: 'pi_3QhAnDKMJ28hjwUR1xSKlySQ', description: 'Payment Intent ID.' })
  @IsString()
  paymentIntentId: string
}