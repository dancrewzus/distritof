import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { License } from 'src/functionalities/licenses/entities/license.entity';

@Schema()
export class Currency extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active currency or not.', type: Boolean })
  isActive: boolean;
  
  @Prop({ type: Boolean, default: false })
  @ApiProperty({ example: true, description: 'Indicates if is this the primary currency of the system or not.', type: Boolean })
  isPrimary: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'USD', description: 'Currency code', type: String })
  code: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'American Dollar', description: 'Currency name', type: String })
  name: string
  
  @Prop({ type: Number, required: true })
  @ApiProperty({ example: 2, description: 'Currency decimals', type: Number })
  decimals: number

  @ApiProperty({ description: 'List of licenses that are related to this currency.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'License' }], select: true })
  licenses: License[];
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Deletion date.', type: String })
  @Prop({ type: String, default: null, nullable: true })
  deletedAt?: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Creation date.', type: String })
  @Prop({ type: String, required: true })
  createdAt?: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Updated date.', type: String })
  @Prop({ type: String, required: true })
  updatedAt?: string;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;
}

export const CurrencySchema = SchemaFactory.createForClass( Currency )
CurrencySchema.plugin(mongoosePaginate)