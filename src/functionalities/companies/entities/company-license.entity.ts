import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { License } from 'src/functionalities/licenses/entities/license.entity';
import { User } from 'src/functionalities/users/entities/user.entity';
import { Company } from './company.entity';
import { Payment } from 'src/functionalities/payments/entities/payment.entity';

@Schema()
export class CompanyLicense extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active license or not.' })
  isActive: boolean;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ example: 'Howarts', description: 'Company.' })
  company: Company;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'License', required: true })
  @ApiProperty({ example: 'Premium', description: 'License.' })
  license: License;

  @ApiProperty({ example: 'Premium', description: 'License name.' })
  @Prop({ type: String, required: true })
  licenseName: string;
  
  @ApiProperty({ example: '01/01/1900', description: 'License start date.' })
  @Prop({ type: String, required: true })
  startDate: string;

  @ApiProperty({ example: '01/01/2900', description: 'License end date.' })
  @Prop({ type: String, required: true })
  endDate: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  @ApiProperty({ example: 'Albus Dumbledore', description: 'Who has added the license?.' })
  createdBy: User;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ type: Boolean, example: true, description: "If the license is outdated the value is true" })
  isOutdated: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Payment', required: false })
  @ApiProperty({ example: '[${paymentType}|${paymentIntentId}] - Payment Description. Company ${companyName}', description: 'Payment.' })
  payment: Payment;
  
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

export const CompanyLicenseSchema = SchemaFactory.createForClass( CompanyLicense )
CompanyLicenseSchema.plugin(mongoosePaginate)