import { ApiProperty } from "@nestjs/swagger"
import { IsString, Matches, MaxLength, MinLength } from "class-validator"

export class ChangePasswordDto {
  
  @ApiProperty({
    example: 'abc-123',
    description: 'Recovery code sended to user email.',
    required: true,
  })
  @IsString()
  @MinLength(1)
  recoveryCode: string
  
  @ApiProperty({
    example: 'Nimbus_2000',
    description: 'User password.',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number'
  }) 
  password: string
}