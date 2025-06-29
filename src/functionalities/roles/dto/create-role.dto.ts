import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateRoleDto {
  
  @ApiProperty({ example: 'Administrator', description: 'Role name.', uniqueItems: true })
  @IsString() 
  name: string
}
