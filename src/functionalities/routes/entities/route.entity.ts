import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity'
import { City } from 'src/functionalities/cities/entities/city.entity';
import { RouteUser } from './routeUser.entity';

@Schema()
export class Route extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active route or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Howarts Express', description: 'Route name' })
  name: string
  
  @Prop({ type: Number, required: false, default: 0 })
  @ApiProperty({ example: 16, description: 'Route active contracts' })
  activeContracts: number
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Route to Howarts', description: 'Route description' })
  description: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Platform 9 3/4, King´s Cross', description: 'Route direction' })
  direction: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: '987987987', description: 'Route phone number' })
  phoneNumber: string

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ example: 'dw6g4165d1g654df', description: 'Route company owner.' })
  company: Company;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'City', required: true })
  @ApiProperty({ example: 'e84g98r498g4r', description: 'Route city ID.' })
  city: City;
  
  @ApiProperty({ description: 'List of users that are related to this route.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'RouteUser' }], select: false, default: [] })
  users: RouteUser[];

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

export const RouteSchema = SchemaFactory.createForClass( Route )
RouteSchema.plugin(mongoosePaginate)