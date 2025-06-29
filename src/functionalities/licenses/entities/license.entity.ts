import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Currency } from 'src/functionalities/currencies/entities/currency.entity';
import { Company } from 'src/functionalities/companies/entities/company.entity';

@Schema()
export class License extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active license or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'LIC0001', description: 'License code' })
  code: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Premium', description: 'License name' })
  name: string
  
  @Prop({ type: Number, required: true })
  @ApiProperty({ example: 1825, description: 'License days' })
  days: number
  
  @Prop({ type: Number, required: true })
  @ApiProperty({ example: 200, description: 'License price' })
  price: number

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Currency', required: true })
  @ApiProperty({ example: 'USD', description: 'License currency.' })
  currency: Currency;

  @ApiProperty({ description: 'List of companies that are related to this license.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Company' }], select: false, default: [] })
  companies: Company[];
  
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

export const LicenseSchema = SchemaFactory.createForClass( License )
LicenseSchema.plugin(mongoosePaginate)