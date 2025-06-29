import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateHolidayDto {
  
  @ApiProperty({ type: String, description: 'Holiday date.', example: '31/10/1981' })
  @IsString()
  holidayDate: string
  
  @ApiProperty({ type: String, description: 'Holiday description.', example: 'Commemorate the day when Lily and James Potter died by Voldemort.' })
  @IsString()
  description: string
  
  @ApiProperty({ type: String, description: 'Holiday is assigned to this company ID', example: '65tj7hf65h498th' })
  @IsString()
  company: string
}
