import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity'
import { City } from 'src/functionalities/cities/entities/city.entity';

@Schema()
export class Neighborhood extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active city or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Hilltown', description: 'Neighborhood name' })
  name: string

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ example: 'dw6g4165d1g654df', description: 'Neighborhood company owner.' })
  company: Company;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'City', required: true })
  @ApiProperty({ example: 'Dundee', description: 'Neighborhood city.' })
  city: City;
  
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

export const NeighborhoodSchema = SchemaFactory.createForClass( Neighborhood )
NeighborhoodSchema.plugin(mongoosePaginate)