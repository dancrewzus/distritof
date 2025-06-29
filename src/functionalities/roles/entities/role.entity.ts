import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose'
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../users/entities/user.entity';

@Schema()
export class Role extends Document {

  @Prop({ type: String, required: true, unique: true })
  @ApiProperty({ example: 'Administrator', description: 'Role name', uniqueItems: true })
  name: string;
  
  @Prop({ type: Boolean, default: false })
  @ApiProperty({ example: false, description: 'It\'s used as default.' })
  primary: boolean;
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active role or not.' })
  isActive: boolean;
  
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], select: false })
  @ApiProperty({ description: 'List of users that are related to this role.', type: [String] })
  users: User[];

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

export const RoleSchema = SchemaFactory.createForClass( Role )
RoleSchema.plugin(mongoosePaginate)