import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

import { Contract } from 'src/functionalities/contracts/entities/contracts.entity';
import { Movement } from 'src/functionalities/movements/entities/movement.entity';
import { User } from 'src/functionalities/users/entities/user.entity';

@Schema()
export class ContractPayment extends Document {
  
  @ApiProperty({ type: String, description: 'User creator ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;
  
  @ApiProperty({ type: String, description: 'Client ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  client: User;
  
  @ApiProperty({ type: String, description: 'Contract ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contract', required: true })
  contract: Contract;
  
  @ApiProperty({ type: Number, description: 'Payed amount', example: 132 })
  @Prop({ type: Number, required: true })
  payedAmount: number;
  
  @ApiProperty({ type: Number, description: 'Payment amount', example: 132 })
  @Prop({ type: Number, required: true })
  paymentAmount: number;
  
  @ApiProperty({ type: Number, description: 'Payment number', example: 3 })
  @Prop({ type: Number, required: true })
  paymentNumber: number;
  
  @ApiProperty({ type: Boolean, description: 'Is complete?', example: false })
  @Prop({ type: Boolean, default: false })
  isComplete: boolean;
  
  @ApiProperty({ description: 'Movements related to this payment.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Movement' }], default: [] })
  movements: Movement[];
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Payment date.' })
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

export const ContractPaymentSchema = SchemaFactory.createForClass( ContractPayment )