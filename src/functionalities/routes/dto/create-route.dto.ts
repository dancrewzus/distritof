import { ApiProperty } from '@nestjs/swagger'
import {
  IsOptional,
  IsString,
} from 'class-validator'


export class CreateRouteDto {
  
  
  @ApiProperty({ example: 'Howarts Express', description: 'Route name.', type: String })
  @IsString()
  name: string
  
  @ApiProperty({ example: 'Route to Howarts', description: 'Route description.', type: String })
  @IsString()
  description: string
  
  @ApiProperty({ example: 'Platform 9 3/4, King´s Cross', description: 'Route direction.', type: String })
  @IsString()
  direction: string
  
  @ApiProperty({ example: '987987987', description: 'Route phone number.', type: String })
  @IsString()
  phoneNumber: string
  
  @ApiProperty({ example: 'wf21ef1e321gf65r1', description: 'Route company owner ID.', type: String })
  @IsString()
  company: string
  
  @ApiProperty({ example: 'wf21ef1e321gf65r1', description: 'Route supervisor ID.', type: String })
  @IsOptional()
  @IsString()
  supervisor?: string
  
  @ApiProperty({ example: 'wf21ef1e321gf65r1', description: 'Route worker ID.', type: String })
  @IsOptional()
  @IsString()
  worker?: string
  
  @ApiProperty({ example: '6e886e4tg44r18g91', description: 'Route city ID.', type: String })
  @IsString()
  city: string
}

