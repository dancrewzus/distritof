import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { User } from 'src/functionalities/users/entities/user.entity'

@Schema()
export class ContractPending extends Document {

  @ApiProperty({ type: String, description: 'Contract ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contract', required: true })
  contract: Contract;

  @ApiProperty({ type: Boolean, description: 'Is contract active?', example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: String, description: 'Worker ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  worker: User;
  
  @ApiProperty({ type: String, description: 'Client ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  client: User;

  @ApiProperty({ type: String, description: 'Route ID', example: '6472d32b20f00d485b965c1e'  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Route', required: true })
  route: Route;

  @ApiProperty({ type: String, description: 'Company ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  company: Company;
  
  // @ApiProperty({ type: String, description: 'Client ID', example: '6472d32b20f00d485b965c1e' })
  // @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ContractNote', required: false, nullable: true, default: null })
  // note: ContractNote;

  @ApiProperty({ type: String, description: 'Client name', example: 'John Doe' })
  @Prop({ type: String, required: true })
  clientName: string;

  @ApiProperty({ type: Number, description: 'Monto del préstamo', example: 120 })
  @Prop({ type: Number, required: true })
  loanAmount: number;

  @ApiProperty({ type: Number, description: 'Monto total del contrato', example: 132 })
  @Prop({ type: Number, required: true })
  totalAmount: number;
  
  @ApiProperty({ type: Number, description: 'Lo que ha pagado', example: 132 })
  @Prop({ type: Number, default: 0 })
  payedAmount: number;

  @ApiProperty({ type: Number, description: 'Lo que falta', example: 68 })
  @Prop({ type: Number, default: 0 })
  pendingAmount: number;

  @ApiProperty({ type: Number, description: 'Monto que no ha sido validado', example: 68 })
  @Prop({ type: Number, default: 0 })
  notValidatedAmount: number;
  
  @ApiProperty({ type: Number, description: 'Valor de la parcela', example: 132 })
  @Prop({ type: Number, required: true })
  paymentAmount: number;
  
  @ApiProperty({ type: Number, description: 'Monto atrasado o incompleto', example: 132 })
  @Prop({ type: Number, required: true })
  amountLateOrIncomplete: number;
  
  @ApiProperty({ type: Number, description: 'Parcelas atrasadas', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsLate: number;
  
  @ApiProperty({ type: Number, description: 'Parcelas al día', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsUpToDate: number;
  
  @ApiProperty({ type: Number, description: 'Parcelas incompletas', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsIncomplete: number;
  
  @ApiProperty({ type: Number, description: 'Parcelas restantes', example: 132 })
  @Prop({ type: Number, required: true })
  paymentsRemaining: number;
  
  @ApiProperty({ type: Number, description: 'Días expirados', example: 132 })
  @Prop({ type: Number, required: true })
  daysExpired: number;
  
  @ApiProperty({ type: Number, description: 'Días adelantados', example: 132 })
  @Prop({ type: Number, required: true })
  daysAhead: number;
  
  @ApiProperty({ type: String, description: 'Icono', example: 'check' })
  @Prop({ type: String, required: false, default: '' })
  icon: string;
  
  @ApiProperty({ type: String, description: 'Color', example: 'green' })
  @Prop({ type: String, required: false, default: '' })
  color: string;
  
  @ApiProperty({ type: Boolean, description: 'Pagó incompleto', example: 132 })
  @Prop({ type: Boolean, required: true })
  todayIncomplete: boolean;
  
  @ApiProperty({ type: Number, description: 'Días pendientes', example: 132 })
  @Prop({ type: Number, required: true })
  daysPending: number;

  @ApiProperty({ type: Boolean, description: 'Have a paid amount problem?', example: true })
  @Prop({ type: Boolean, default: false })
  payedAmountProblem: boolean;

  @ApiProperty({ type: Boolean, description: 'Is outdated?', example: true })
  @Prop({ type: Boolean, default: false })
  isOutdated: boolean;

  @ApiProperty({ type: Boolean, description: 'Is client updated if contract is outdated?', example: true })
  @Prop({ type: Boolean, default: false })
  isClientUpdatedForOutdated: boolean;

  @ApiProperty({ example: '01/01/1900', description: 'Last contract payment date.' })
  @Prop({ type: String, default: '01/01/1900' })
  lastPaymentDate?: string;
  
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

export const ContractPendingSchema = SchemaFactory.createForClass( ContractPending )
ContractPendingSchema.plugin(mongoosePaginate)