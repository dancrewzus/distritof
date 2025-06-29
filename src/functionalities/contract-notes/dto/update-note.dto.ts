import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateNoteDto } from './create-note.dto';

export class UpdateNoteDto extends CreateNoteDto {
  
  @ApiProperty({ example: 'You are selected for Howarts School', description: 'Note description.', type: String })
  @IsString()
  description: string
}
