import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreatePaymentModalityDto } from "./create-payment-modality.dto";
import { IsBoolean, IsOptional } from "class-validator";

export class UpdatePaymentModalityDto extends PartialType(CreatePaymentModalityDto) {
  @ApiProperty({ example: false, description: 'Indicates if is an active payment modality or not.', type: Boolean })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
