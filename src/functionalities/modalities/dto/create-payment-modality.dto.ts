import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator'

export enum MethodsEnum {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
}

export class CreatePaymentModalityDto {

  @ApiProperty({ type: String, description: 'Payment modality is assigned to this company ID', example: '65tj7hf65h498th' })
  @IsString()
  company: string
  
  @ApiProperty({ type: String, description: 'Payment modality title.', example: '10% 4d' })
  @IsString()
  title: string

  @ApiProperty({ type: String, description: 'Payment modality value.', example: '10-4' })
  @IsString()
  value: string

  @ApiProperty({ type: String, description: 'Payment modality method', example: 'daily' })
  @IsString()
  @IsEnum(MethodsEnum)
  type: string

  @ApiProperty({ type: Number, description: 'Payment modality percent.', example: 10 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  percent: number
  
  @ApiProperty({ type: Number, description: 'Payment modality days.', example: 4 })
  @IsNumber()
  @Min(0)
  days: number
  
  @ApiProperty({ type: Number, description: 'Payment modality weeks.', example: 2 })
  @IsNumber()
  @Min(0)
  weeks: number
  
  @ApiProperty({ type: Number, description: 'Payment modality fortnights.', example: 2 })
  @IsNumber()
  @Min(0)
  fortnights: number
  
  @ApiProperty({ type: Number, description: 'Payment modality months.', example: 2 })
  @IsNumber()
  @Min(0)
  months: number

  @ApiProperty({ type: Boolean, description: 'Payment modality accept days off?.', example: false })
  @IsBoolean()
  offDays: boolean
}

