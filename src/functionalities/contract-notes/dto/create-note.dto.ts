import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateNoteDto {
  
  @ApiProperty({ example: 'You are selected for Howarts School', description: 'Note description.', type: String })
  @IsString()
  description: string
  
  @ApiProperty({ example: '65d4f654d64g4r', description: 'Contract ID.', type: String })
  @IsString()
  contract: string
}

