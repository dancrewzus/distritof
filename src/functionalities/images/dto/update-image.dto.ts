import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class UpdateImageDto {
  
  @ApiProperty({ type: String, description: 'Image id', example: '65d4g51d65gd1c651' })
  @IsString()
  id: string
}