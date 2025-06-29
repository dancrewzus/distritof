import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

import { User } from 'src/functionalities/users/entities/user.entity';
import { Company } from 'src/functionalities/companies/entities/company.entity';

@Schema()
export class DailyResume extends Document {
  
  @ApiProperty({ type: String, description: 'Daily movement type', example: 'late-night' })
  @Prop({ type: String, required: true })
  type: string;
  
  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  company: Company;  // ✅ Nuevo campo: Se agrega la referencia a la empresa

  @ApiProperty({ type: String, description: 'Worker ID (optional)', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false, nullable: true })
  worker?: User;  // ✅ Hacemos que worker sea opcional
  
  @ApiProperty({ type: Number, description: 'Amount to be collected', example: 132 })
  @Prop({ type: Number, required: true })
  amountToBeCollected: number;

  @ApiProperty({ type: Number, description: 'Payments to be collected', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsToBeCollected: number;

  @ApiProperty({ type: Number, description: 'Regular contracts from today', example: 132 })
  @Prop({ type: Number, required: true })
  regularContractsFromToday: number;

  @ApiProperty({ type: Number, description: 'Contracts amount from today', example: 132 })
  @Prop({ type: Number, required: true })
  amountContractsFromToday: number;

  @ApiProperty({ type: Number, description: 'Contracts created today', example: 132 })
  @Prop({ type: Number, required: true })
  contractsFromToday: number;

  @ApiProperty({ type: Number, description: 'Collected movements', example: 132 })
  @Prop({ type: Number, required: true })
  movementsCollected: number;

  @ApiProperty({ type: Number, description: 'Payments collected', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsCollected: number;

  @ApiProperty({ type: Number, description: 'Payments collected (Complete)', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsCollectedComplete: number;  // ✅ Separado en completo e incompleto

  @ApiProperty({ type: Number, description: 'Payments collected (Incomplete)', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsCollectedIncomplete: number;  // ✅ Nuevo campo para pagos incompletos

  @ApiProperty({ type: Number, description: 'Total amount collected', example: 132 })
  @Prop({ type: Number, required: true })
  amountCollected: number;

  @ApiProperty({ type: Number, description: 'Total expenses', example: 132 })
  @Prop({ type: Number, required: true })
  expensesAmount: number;

  @ApiProperty({ type: Number, description: 'Total incomes', example: 132 })
  @Prop({ type: Number, required: true })
  incomesAmount: number;

  @ApiProperty({ type: Number, description: 'Previous day amount', example: 132 })
  @Prop({ type: Number, required: true })
  beforeAmount: number;  // ✅ Confirmamos que este campo se calcula antes de almacenar

  @ApiProperty({ type: Number, description: 'Total cash in the company today', example: 132 })
  @Prop({ type: Number, required: true })
  todayAmount: number;

  @ApiProperty({ type: Number, description: 'Total cash collected today', example: 132 })
  @Prop({ type: Number, required: true })
  todayCash: number;

  @ApiProperty({ type: Number, description: 'Total bank deposits today', example: 132 })
  @Prop({ type: Number, required: true })
  todayBank: number;

  @ApiProperty({ type: String, description: 'Daily resume date', example: '01/01/1900 00:00:00' })
  @Prop({ type: String, required: true })
  date: string;
  
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

export const DailyResumeSchema = SchemaFactory.createForClass(DailyResume);
