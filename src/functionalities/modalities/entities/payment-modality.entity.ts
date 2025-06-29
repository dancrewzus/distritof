import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity'
import { User } from 'src/functionalities/users/entities/user.entity'

@Schema()
export class PaymentModality extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active payment modality or not.' })
  isActive: boolean;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ type: String, example: '6472d32b20f00d485b965c1e', description: 'Payment modality is assigned to this company' })
  company: Company;
  
  @ApiProperty({ type: String, description: 'User creator ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;
  
  @ApiProperty({ example: '10% 4d', description: 'Title' })
  @Prop({ type: String, required: true })
  title: string;
  
  @ApiProperty({ example: '10-4', description: 'Value' })
  @Prop({ type: String, required: true })
  value: string;

  @ApiProperty({ type: String, description: 'Payment method', example: 'daily' })
  @Prop({ type: String, required: true, enum: [ 'daily', 'weekly', 'fortnightly', 'monthly' ] })
  type: string;

  @ApiProperty({ type: Number, description: 'Percent', example: 10 })
  @Prop({ type: Number, required: true })
  percent: number;

  @ApiProperty({ type: Number, description: 'Days', example: 4 })
  @Prop({ type: Number, default: 0 })
  days: number;
  
  @ApiProperty({ type: Number, description: 'Weeks', example: 2 })
  @Prop({ type: Number, default: 0 })
  weeks: number;
  
  @ApiProperty({ type: Number, description: 'Fortnights', example: 2 })
  @Prop({ type: Number, default: 0 })
  fortnights: number;
  
  @ApiProperty({ type: Number, description: 'Months', example: 2 })
  @Prop({ type: Number, default: 0 })
  months: number;

  @ApiProperty({ type: Boolean, description: 'Accept days off?', example: true })
  @Prop({ type: Boolean, default: false })
  offDays: boolean;
  
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

export const PaymentModalitySchema = SchemaFactory.createForClass( PaymentModality )
PaymentModalitySchema.plugin(mongoosePaginate)