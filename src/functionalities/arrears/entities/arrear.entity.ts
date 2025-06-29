import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose'
import { ApiProperty } from '@nestjs/swagger'
import * as mongoosePaginate from 'mongoose-paginate-v2'

import { Company } from 'src/functionalities/companies/entities/company.entity';

@Schema()
export class Arrear extends Document {

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active arrear or not.' })
  isActive: boolean;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ type: String, example: '6472d32b20f00d485b965c1e', description: 'Arrear is assigned to this company' })
  company: Company;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: '1981', description: 'Arrear year.' })
  arrearYear: string;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: '12', description: 'Arrear month.' })
  arrearMonth: string;
  
  @ApiProperty({ type: Number, description: 'Arrear percent', example: 10 })
  @Prop({ type: Number, required: true })
  percent: number;
  
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

export const ArrearSchema = SchemaFactory.createForClass( Arrear )
ArrearSchema.plugin(mongoosePaginate)