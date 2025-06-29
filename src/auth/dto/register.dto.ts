import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsEmail,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator'

export class RegisterDto {
  
  @ApiProperty({ example: 'adumbledore@howarts.magic', description: 'User email.' })
  @IsEmail()
  email: string
  
  @ApiProperty({ example: 'profesor.AlbusD-81_', description: 'User password.' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(
    /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener al menos un carácter en mayúscula, uno en minúscula y un número.'
  })
  password: string

  @ApiProperty({ example: 'Albus', description: 'User first name.' })
  @IsString()
  @MinLength(2)
  firstName: string
  
  @ApiProperty({ example: 'Dumbledore', description: 'User paternal surname.' })
  @IsString()
  @MinLength(2)
  paternalSurname: string

  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Country ID.' })
  @IsString()
  country: string
  
  @ApiProperty({ example: '123456789', description: 'User phone number.' })
  @IsString()
  @MinLength(5)
  phoneNumber: string
  
  @ApiProperty({ example: 'male', description: 'User gender.' })
  @IsString()
  gender: string

  @ApiProperty({ example: 'Hogwarts', description: 'User residence address.' })
  @IsString()
  @MinLength(2)
  residenceAddress: string

  @ApiProperty({ example: 'Hogwarts', description: 'User billing address.' })
  @IsString()
  @MinLength(2)
  billingAddress: string

  @ApiProperty({ example: 'Name of my fav witch?', description: 'User security answer.' })
  @IsString()
  @MinLength(2)
  securityQuestion: string

  @ApiProperty({ example: ':)', description: 'User security question.' })
  @IsString()
  @MinLength(2)
  securityAnswer: string

  @ApiProperty({ example: '12.345.678-9', description: 'User identifier.' })
  @IsString()
  identifier: string

  @ApiProperty({ example: '646ae975732fecc4a485707d', description: 'Identifier type ID.' })
  @IsString()
  identifierType: string
  
  @ApiProperty({ example: '27/05/2030', description: 'Identifier expire date.' })
  @IsString()
  identifierExpireDate: string
  
}
