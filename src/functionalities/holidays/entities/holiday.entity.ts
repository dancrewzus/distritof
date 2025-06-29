import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { ApiProperty } from '@nestjs/swagger'
import * as mongoosePaginate from 'mongoose-paginate-v2'

import { Company } from 'src/functionalities/companies/entities/company.entity';

@Schema()
export class Holiday extends Document {

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active holiday or not.' })
  isActive: boolean;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ type: String, example: '6472d32b20f00d485b965c1e', description: 'Holiday is assigned to this company' })
  company: Company;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: '31/10/1981', description: 'Holiday date.' })
  holidayDate: string;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Commemorate the day when Lily and James Potter died by Voldemort.', description: 'Holiday description.' })
  description: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Deletion date.' })
  @Prop({ type: String, default: null, nullable: true })
  deletedAt?: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Creation date.' })
  @Prop({ type: String, required: true })
  createdAt?: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Updated date.' })
  @Prop({ type: String, required: true })
  updatedAt?: string;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;
}

export const HolidaySchema = SchemaFactory.createForClass( Holiday )
HolidaySchema.plugin(mongoosePaginate)