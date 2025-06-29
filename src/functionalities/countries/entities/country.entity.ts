import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Currency } from 'src/functionalities/currencies/entities/currency.entity';

@Schema()
export class Country extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active country or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'SCT', description: 'Country code' })
  code: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Scotland', description: 'Country name' })
  name: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: '+44', description: 'Country phone code.' })
  phoneCode: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Europe', description: 'Continent.' })
  continent: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Northern Europe', description: 'Continent region.' })
  region: string

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Currency', required: true })
  @ApiProperty({ example: 'USD', description: 'Country currency.' })
  currency: Currency;

  @ApiProperty({ description: 'List of companies that are related to this country.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Company' }], select: false })
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

export const CountrySchema = SchemaFactory.createForClass( Country )
CountrySchema.plugin(mongoosePaginate)