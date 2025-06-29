import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive, IsString, Min } from "class-validator";

export class CreateArrearDto {
  
  @ApiProperty({ type: String, description: 'Arrear year.', example: '1981' })
  @IsString()
  arrearYear: string
  
  @ApiProperty({ type: String, description: 'Arrear month.', example: '12' })
  @IsString()
  arrearMonth: string
  
  @ApiProperty({ type: Number, description: 'Payment modality percent.', example: 10 })
  @IsNumber()
  @IsPositive()
  @Min(0)
  percent: number
  
  @ApiProperty({ type: String, description: 'Arrear is assigned to this company ID', example: '65tj7hf65h498th' })
  @IsString()
  company: string
}
