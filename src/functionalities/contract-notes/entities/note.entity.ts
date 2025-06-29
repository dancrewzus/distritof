import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { User } from 'src/functionalities/users/entities/user.entity'

@Schema()
export class ContractNote extends Document {

  @ApiProperty({ type: String, description: 'Contract ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contract', required: true })
  contract: Contract;

  @ApiProperty({ example: 'Payment of contract #', description: 'Movement description.' })
  @Prop({ type: String, required: true })
  description: string;

  @ApiProperty({ type: String, description: 'User creator ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;
  
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

export const ContractNoteSchema = SchemaFactory.createForClass( ContractNote )
ContractNoteSchema.plugin(mongoosePaginate)