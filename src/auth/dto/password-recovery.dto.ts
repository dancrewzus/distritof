import { ApiProperty } from "@nestjs/swagger"
import { IsString, MinLength } from "class-validator"

export class PasswordRecoveryDto {
  
  @ApiProperty({
    example: 'hpotter@howarts.magic',
    description: 'User email.',
    required: true,
  })
  @IsString()
  @MinLength(5)
  email: string
}