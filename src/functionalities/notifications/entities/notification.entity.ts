import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { User } from 'src/functionalities/users/entities/user.entity';

@Schema()
export class Notification extends Document {

  @ApiProperty({ example: '654df2465ed4f4654edf', description: 'Notification checked by User' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false, nullable: true })
  checkedBy: User

  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'You have a new contract', description: 'Notification title' })
  title: string;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'Well done! You have a new contract...', description: 'Notification description' })
  description: string;

  @ApiProperty({ example: 'contract', description: 'Notification type' })
  @Prop({ type: String, required: true, enum: [ 'payment', 'contract', 'final' ] })
  type: string;
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: false, description: 'Notification status' })
  isChecked: boolean;

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

export const NotificationSchema = SchemaFactory.createForClass( Notification )
NotificationSchema.plugin(mongoosePaginate)
