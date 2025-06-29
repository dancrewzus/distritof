import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'


export class CreateIdentifierDto {
  
  @ApiProperty({
    example: 'ID001',
    description: 'Identifier code.',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(6)
  code: string
  
  @ApiProperty({
    example: 'RUT',
    description: 'Identifier name.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name: string
  
  @ApiProperty({
    example: 'XX.XXX.XXX-X',
    description: 'Identifier format.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  format: string
}
