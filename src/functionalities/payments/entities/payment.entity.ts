import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Currency } from 'src/functionalities/currencies/entities/currency.entity';
import { Company } from 'src/functionalities/companies/entities/company.entity';
import { License } from 'src/functionalities/licenses/entities/license.entity';
import { User } from 'src/functionalities/users/entities/user.entity';
import { Image } from 'src/functionalities/images/entities/image.entity'

@Schema()
export class Payment extends Document {

  @ApiProperty({ example: 'pi_3MtwBwLkdIwHu7ix28a3tqPa', description: 'Stripe Payment Intent Id.' })
  @Prop({ type: String, default: null })
  paymentIntentId: string;

  @ApiProperty({ example: '123456789', description: 'Bank transfer reference' })
  @Prop({ type: String, default: null })
  bankWireReference: string;

  @ApiProperty({ example: '200', description: 'License price.' })
  @Prop({ type: Number, required: true })
  amount: number;

  @ApiProperty({ example: '1', description: 'Exchange rate by currency.' })
  @Prop({ type: Number, default: 1 })
  exchangeRate: number;

  @ApiProperty({ example: 'tdc', description: 'Payment Type.' })
  @Prop({ type: String, required: true, enum: [ 'transfer', 'tdc' ] })
  paymentType: string;

  @ApiProperty({ example: 'succeeded', description: 'Stripe Status Payment or Transfer Status' })
  @Prop({ type: String, required: true, enum: [ 'canceled', 'requires_confirmation', 'requires_payment_method', 'succeeded' ] })
  status: string;

  @ApiProperty({ example: '[${paymentType}|${paymentIntentId}] - Payment Description. Company ${companyName}', description: 'Payment Description.' })
  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Boolean, default: false })
  @ApiProperty({ example: true, description: 'Indicates if is an license payment or not.' })
  isLicensePayment: boolean;

  @ApiProperty({ type: String, description: 'Payment image ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Image', required: false, default: null, nullable: true })
  paymentPicture: Image;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  @ApiProperty({ example: 'Albus Dumbledore', description: 'Who has added the license?.' })
  user: User;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Currency', required: true })
  @ApiProperty({ example: 'USD', description: 'Currency.' })
  currency: Currency;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ example: 'Howarts', description: 'Company.' })
  company: Company;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'License', required: true })
  @ApiProperty({ example: 'Premium', description: 'License.' })
  license: License;
  
  @ApiProperty({ example: '01/01/1900', description: 'Payment date.' })
  @Prop({ type: String, required: true })
  paymentDate: string;
 
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

export const PaymentsSchema = SchemaFactory.createForClass( Payment )
PaymentsSchema.plugin(mongoosePaginate)