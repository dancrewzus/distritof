import { ApiProperty } from "@nestjs/swagger"
import { IsString, MaxLength, MinLength } from "class-validator"

export class ClientLoginDto {
  
  @ApiProperty({
    example: '123456789',
    description: 'User identifier',
    required: true,
  })
  @IsString()
  @MinLength(4)
  identifier: string
  
  @ApiProperty({
    example: 'Nimbus_2000',
    description: 'User password',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password: string
}