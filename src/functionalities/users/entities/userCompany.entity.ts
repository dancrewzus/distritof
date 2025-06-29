import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity';
import { User } from 'src/functionalities/users/entities/user.entity';

@Schema()
export class UserCompany extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active license or not.' })
  isActive: boolean;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  @ApiProperty({ example: 'Howarts', description: 'Company.' })
  company: Company;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  @ApiProperty({ example: 'Albus Dumbledore', description: 'User.' })
  user: User;
  
  @ApiProperty({ example: 'companyAdmin', description: 'User role.' })
  @Prop({ type: String, default: null, nullable: true })
  role: string;
  
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

export const UserCompanySchema = SchemaFactory.createForClass( UserCompany )
UserCompanySchema.plugin(mongoosePaginate)