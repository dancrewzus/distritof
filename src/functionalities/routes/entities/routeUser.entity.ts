import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Route } from 'src/functionalities/routes/entities/route.entity';
import { User } from 'src/functionalities/users/entities/user.entity';

@Schema()
export class RouteUser extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active license or not.' })
  isActive: boolean;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Route', required: true })
  @ApiProperty({ example: 'Howarts', description: 'Route.' })
  route: Route;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  @ApiProperty({ example: 'Albus Dumbledore', description: 'User.' })
  user: User;
  
  @ApiProperty({ example: 'companyAdmin', description: 'User role.' })
  @Prop({ type: String, required: true })
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

export const RouteUserSchema = SchemaFactory.createForClass( RouteUser )
RouteUserSchema.plugin(mongoosePaginate)