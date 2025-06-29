import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  MaxLength,
  MinLength,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator'

import { CreateImageDto } from "src/functionalities/images/dto";

enum UserGender {
  'system',
  'male',
  'female',
  'undefined'
}

export class CreateUserDto {

  @ApiProperty({ example: '12.345.678-9', description: 'User identifier.' })
  @IsString()
  identifier?: string

  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier type ID.' })
  @IsString()
  identifierType?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier picture ID.' })
  @IsString()
  @IsOptional()
  identifierPicture?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier expire date.' })
  @IsString()
  @IsOptional()
  identifierExpireDate?: string

  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Country ID.' })
  @IsString()
  country?: string

  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Company ID.' })
  @IsString()
  @IsOptional()
  company?: string
  
  @ApiProperty({ example: 'adumbledore@howarts.magic', description: 'User email.' })
  @IsEmail()
  email: string
  
  @ApiProperty({ example: 'profesor.AlbusD-81_', description: 'User password.' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'The password must have a Uppercase, lowercase letter and a number'
  })
  @IsOptional()
  password?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User role ID.' })
  @IsString()
  @MinLength(5)
  @IsOptional()
  role: string

  @ApiProperty({ example: 'Albus', description: 'User name.' })
  @IsString() 
  firstName: string
  
  @ApiProperty({ example: 'Dumbledore', description: 'User lastname.' })
  @IsString() 
  paternalSurname: string
  
  @ApiProperty({ example: '¿Cuál es el nombre de tu mascota mágica?', description: 'User security question.' })
  @IsString()
  @IsOptional()
  securityQuestion: string
  
  @ApiProperty({ example: 'Fawkes', description: 'User security answer.' })
  @IsString()
  @IsOptional()
  securityAnswer: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User profile picture ID.' })
  @IsObject()
  @IsOptional()
  profilePictureDto?: CreateImageDto
 
  @ApiProperty({ example: 'male', description: 'User gender.' })
  @IsEnum(UserGender)
  @IsOptional()
  gender?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User address picture ID.' })
  @IsObject()
  @IsOptional()
  addressPictureDto?: CreateImageDto

  @ApiProperty({ example: 'Hogwarts', description: 'User residence address.' })
  @IsString()
  @IsOptional() 
  residenceAddress?: string
  
  @ApiProperty({ example: 'Hogwarts', description: 'User billing address.' })
  @IsString()
  @IsOptional() 
  billingAddress?: string
  
  @ApiProperty({ example: '01/01/1900', description: 'User entry date.' })
  @IsString()
  @IsOptional() 
  entryDate?: string
  
  @ApiProperty({ example: '654f65d654654dfg', description: 'City assigned ID' })
  @IsString()
  @IsOptional() 
  city?: string
  
  @ApiProperty({ example: 'f65h465t45h65t4', description: 'Route assigned ID' })
  @IsString()
  @IsOptional() 
  route?: string
  
  @ApiProperty({ example: ['f65h465t45h65t4'], description: 'Routes assigned ID' })
  @IsArray()
  @IsOptional() 
  routes?: string[]
  
  @ApiProperty({ example: '123456789', description: 'User phone number.' })
  @IsString()
  @MinLength(2)
  phoneNumber: string
}
