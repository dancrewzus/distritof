import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Country } from 'src/functionalities/countries/entities/country.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'

@Schema()
export class City extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active city or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Dundee', description: 'City name' })
  name: string

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ example: '654ef654654r', description: 'City company owner.' })
  company: Company;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Country', required: true })
  @ApiProperty({ example: 'Scotland', description: 'City country.' })
  country: Country;

  @ApiProperty({ description: 'List of routes that are related to this city.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Route' }], select: true, default: [] })
  routes: Route[];
  
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

export const CitySchema = SchemaFactory.createForClass( City )
CitySchema.plugin(mongoosePaginate)