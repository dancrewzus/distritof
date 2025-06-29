import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { ApiProperty } from '@nestjs/swagger'
import * as mongoosePaginate from 'mongoose-paginate-v2'

import { UserCompany } from 'src/functionalities/users/entities/userCompany.entity'
import { Country } from 'src/functionalities/countries/entities/country.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { City } from 'src/functionalities/cities/entities/city.entity'
import { User } from 'src/functionalities/users/entities/user.entity'
import { CompanyLicense } from './company-license.entity'
import { Parameter } from 'src/functionalities/parameters/entities/parameter.entity'

@Schema()
export class Company extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Indicates if is an active company or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ type: String, example: 'Howarts', description: 'Company name' })
  name: string
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  @ApiProperty({ type: String, example: 'Albus Dumbledore', description: 'Company representative user ID.' })
  representative: User;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ type: String, example: 'hello@howarts.magic', description: 'Company email.' })
  email: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ type: String, example: 'contact@howarts.magic', description: 'Company contact email.' })
  contactEmail: string

  @ApiProperty({ example: '1', description: 'Onboarding steps' })
  @Prop({ type: String, required: false, enum: [ '1', '2', '3', '4', '5', '6', 'completed' ], default: 'completed' })
  onboardingSteps: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Country', required: true, select: true })
  @ApiProperty({ example: 'Scotland', description: 'Company located country ID.' })
  country: Country;

  @ApiProperty({ description: 'List of licenses that are related to this company.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Parameter' }], select: true, default: [] })
  parameter: Parameter[];

  @ApiProperty({ description: 'List of licenses that are related to this company.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CompanyLicense' }], select: true, default: [] })
  licenses: CompanyLicense[];

  @ApiProperty({ description: 'List of routes that are related to this company.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Route' }], select: true, default: [] })
  routes: Route[];

  @ApiProperty({ description: 'List of cities that are related to this company.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'City' }], select: true, default: [] })
  cities: City[];

  @ApiProperty({ description: 'List of users that are related to this company.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserCompany' }], select: false, default: [] })
  users: UserCompany[]

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

export const CompanySchema = SchemaFactory.createForClass( Company )
CompanySchema.plugin(mongoosePaginate)