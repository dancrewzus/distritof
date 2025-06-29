import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class SecretPaymentDto {
  @ApiProperty({ type: String, example: '646ae975732fecc4a485707d', description: 'License ID.' })
  @IsString()
  licenseId: string
}