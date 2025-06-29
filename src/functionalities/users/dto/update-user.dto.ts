import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

enum UserGender {
  'system',
  'male',
  'female',
  'undefined'
}

export class UpdateUserDto {
  
  @ApiProperty({ example: '12.345.678-9', description: 'User identifier.' })
  @IsString()
  @IsOptional()
  identifier?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier type ID.' })
  @IsString()
  @IsOptional()
  identifierType?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier picture ID.' })
  @IsString()
  @IsOptional()
  identifierPicture?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User role.' })
  @IsString()
  @IsOptional()
  role?: string

  @ApiProperty({ example: '01/01/1900', description: 'User entry date.' })
  @IsString()
  @IsOptional() 
  entryDate?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User company.' })
  @IsString()
  @IsOptional()
  company?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User route.' })
  @IsString()
  @IsOptional()
  route?: string
  
  @ApiProperty({ example: [ '646ae975732fecc4a485707d' ], description: 'User routes.' })
  @IsArray()
  @IsOptional()
  routes?: string[]
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User route.' })
  @IsString()
  @IsOptional()
  city?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier expire date.' })
  @IsString()
  @IsOptional()
  identifierExpireDate?: string

  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Country ID.' })
  @IsString()
  @IsOptional() 
  country?: string

  @ApiProperty({ example: 'adumbledore@howarts.magic', description: 'User email.' })
  @IsEmail()
  @IsOptional()
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
  password: string

  @ApiProperty({ example: 'Albus', description: 'User name.' })
  @IsString()
  @IsOptional()
  firstName: string
  
  @ApiProperty({ example: 'Dumbledore', description: 'User lastname.' })
  @IsString()
  @IsOptional()
  paternalSurname: string
  
  @ApiProperty({ example: '¿Cuál es el nombre de tu mascota mágica?', description: 'User security question.' })
  @IsString() 
  @IsOptional()
  securityQuestion?: string
  
  @ApiProperty({ example: 'Fawkes', description: 'User security answer.' })
  @IsString() 
  @IsOptional()
  securityAnswer?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User profile picture ID.' })
  @IsString()
  @IsOptional()
  profilePicture?: string

  @ApiProperty({ example: 'male', description: 'User gender.' })
  @IsEnum(UserGender)
  @IsOptional()
  gender?: string
  
  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'User address picture ID.' })
  @IsString()
  @IsOptional()
  addressPicture?: string

  @ApiProperty({ example: 'Hogwarts', description: 'User residence address.' })
  @IsString()
  @IsOptional() 
  residenceAddress?: string
  
  @ApiProperty({ example: 'Hogwarts', description: 'User billing address.' })
  @IsString()
  @IsOptional() 
  billingAddress?: string
  
  @ApiProperty({ example: '123456789', description: 'User phone number.' })
  @IsString()
  @IsOptional()
  phoneNumber: string
}