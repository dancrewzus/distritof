import { ApiProperty } from "@nestjs/swagger"
import { IsString, Matches, MaxLength, MinLength } from "class-validator"

export class ValidateEmailDto {
  
  @ApiProperty({
    example: '96d8f435wd1g6er1',
    description: 'User ID.',
    required: true,
  })
  @IsString()
  id: string
  
  @ApiProperty({
    example: '96d8f435wd1g6er1',
    description: 'User validation code sended to email.',
    required: true,
  })
  @IsString()
  validationCode: string
}