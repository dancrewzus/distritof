import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { PaymentModality } from 'src/functionalities/modalities/entities/payment-modality.entity'
import { ContractPayment } from 'src/functionalities/contract-payments/entities/payment.entity'
import { ContractPending } from 'src/functionalities/contract-pending/entities/pending.entity'
import { ContractNote } from 'src/functionalities/contract-notes/entities/note.entity'
import { Movement } from 'src/functionalities/movements/entities/movement.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Image } from 'src/functionalities/images/entities/image.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { User } from '../../users/entities/user.entity'


@Schema()
export class Contract extends Document {

  @ApiProperty({ type: Number, description: 'Contract number', example: 1254 })
  @Prop({ type: Number, required: true })
  contractNumber: number;

  @ApiProperty({ type: Boolean, description: 'Is active?', example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: Boolean, description: 'Is contract validated by an administrator?', example: true })
  @Prop({ type: Boolean, default: false })
  isValidated: boolean;

  @ApiProperty({ type: String, description: 'Route ID', example: '6472d32b20f00d485b965c1e'  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Route', required: true })
  route: Route;

  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  company: Company;
  
  @ApiProperty({ type: String, description: 'Client ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  client: User;

  @ApiProperty({ type: String, description: 'Contract created by ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @ApiProperty({ type: String, description: 'Contract validated by ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false, nullable: true })
  validatedBy: User;

  @ApiProperty({ type: String, description: 'Worker ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  worker: User;
  
  @ApiProperty({ type: String, description: 'Product image ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Image', default: null, nullable: true })
  productPicture: Image;
  
  @ApiProperty({ type: String, description: 'Contract pending ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ContractPending', default: null, nullable: true })
  contractPending: ContractPending;
  
  @ApiProperty({ type: String, description: 'Payment modality method', example: 'daily' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PaymentModality', required: true, select: true })
  modality: PaymentModality;

  @ApiProperty({ description: 'List of notes.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'ContractNote' }], select: true })
  notes: ContractNote[];  

  @ApiProperty({ description: 'List of movements.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Movement' }], select: false })
  movementList: Movement[];
  
  @ApiProperty({ description: 'List of payments.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'ContractPayment' }], select: false })
  paymentList: ContractPayment[];

  @ApiProperty({ example: '01/01/1900', description: 'Last contract date.' })
  @Prop({ type: String, required: false, nullable: true })
  lastContractDate: string;

  @ApiProperty({ type: Number, description: 'Loan amount', example: 120 })
  @Prop({ type: Number, required: true })
  loanAmount: number;

  @ApiProperty({ type: Number, description: 'Loan percent', example: 10 })
  @Prop({ type: Number, required: true })
  percent: number;

  @ApiProperty({ type: Number, description: 'Payments quantity', example: 20 })
  @Prop({ type: Number, required: true })
  paymentsQuantity: number;
  
  @ApiProperty({ type: Number, description: 'Total amount', example: 132 })
  @Prop({ type: Number, required: true })
  totalAmount: number;
  
  @ApiProperty({ type: Number, description: 'Payment amount', example: 6.6 })
  @Prop({ type: Number, required: true })
  paymentAmount: number;

  @ApiProperty({ description: 'List of payment days (dates).', type: [String] })
  @Prop({ type: [{ type: String }], select: true, required: true })
  paymentDays: string[];

  @ApiProperty({ type: String, description: 'Non-working days', example: 'LuMaMiJuViSaDo' })
  @Prop({ type: String, required: false, default: 'Do' })
  nonWorkingDays: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Finished date.' })
  @Prop({ type: String, default: null, nullable: true })
  finishedAt?: string;
  
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

export const ContractSchema = SchemaFactory.createForClass( Contract )
ContractSchema.plugin(mongoosePaginate)

