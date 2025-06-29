import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'


import { ContractPayment } from 'src/functionalities/contract-payments/entities/payment.entity'
import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { Image } from 'src/functionalities/images/entities/image.entity'
import { User } from 'src/functionalities/users/entities/user.entity'

@Schema()
export class Movement extends Document {

  @ApiProperty({ type: Number, description: 'Movement number', example: 1254 })
  @Prop({ type: Number, required: true })
  movementNumber: number;
  
  @ApiProperty({ type: String, description: 'User creator ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @ApiProperty({ type: String, description: 'User who validate this movement', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  validatedBy: User;

  @ApiProperty({ type: String, description: 'Contract ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contract', required: false, default: null, nullable: true })
  contract: Contract;

  @ApiProperty({ type: String, description: 'Route ID', example: '6472d32b20f00d485b965c1e'  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Route', required: false, default: null, nullable: true })
  route: Route;

  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  company: Company;
  
  @ApiProperty({ type: String, description: 'Payment image ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Image', required: false, default: null, nullable: true })
  paymentPicture: Image;
  
  @ApiProperty({ type: Number, description: 'Movement amount', example: 132 })
  @Prop({ type: Number, required: true })
  amount: number;
  
  @ApiProperty({ example: 'in', description: 'Movement type' })
  @Prop({ type: String, required: true, enum: [ 'in', 'out', 'final' ] })
  type: string;
  
  @ApiProperty({ example: 'Payment of contract #', description: 'Movement description.' })
  @Prop({ type: String, required: true })
  description: string;

  @ApiProperty({ type: String, description: 'Movement status', example: 'pending' })
  @Prop({ type: String, required: true, enum: [ 'pending', 'validated' ] })
  status: string;
  
  @ApiProperty({ type: String, description: 'Movement type', example: 'bank' })
  @Prop({ type: String, required: false, enum: [ 'bank', 'cash', null ], default: null })
  paymentType: string;
  
  @ApiProperty({ example: '', description: 'Movement comment.' })
  @Prop({ type: String, required: false, default: '' })
  comment: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Movement date.' })
  @Prop({ type: String, required: true })
  movementDate: string;
  
  @ApiProperty({ description: 'List of payments.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'ContractPayment' }], select: false })
  paymentList: ContractPayment[];

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

export const MovementSchema = SchemaFactory.createForClass( Movement )
MovementSchema.plugin(mongoosePaginate)
