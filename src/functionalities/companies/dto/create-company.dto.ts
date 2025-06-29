import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

export class CreateCompanyDto {
  
  @ApiProperty({ type: String, example: 'Howarts', description: 'Company name.' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string

  @ApiProperty({ type: String, example: 'hello@howarts.magic', description: 'Company email.' })
  @IsEmail()
  email: string

  @ApiProperty({ type: String, example: 'contact@howarts.magic', description: 'Company contact email.' })
  @IsEmail()
  contactEmail: string

  @ApiProperty({ type: String, example: '123456789', description: 'Company phone number.' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  phoneNumber: string

  @ApiProperty({ type: String, example: '646ae975732fecc4a485707d', description: 'Company located country ID.' })
  @IsString()
  country: string

}