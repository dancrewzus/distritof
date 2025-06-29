import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoosePaginate from 'mongoose-paginate-v2'

import { User } from '../../users/entities/user.entity';

@Schema()
export class Image extends Document {
  
  @ApiProperty({ type: String, description: 'User creator ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @ApiProperty({ description: 'Image url', example: 'http://...' })
  @Prop({ type: String, required: true })
  imageUrl: string;
  
  @ApiProperty({ description: 'Image public ID', example: 'clients/id' })
  @Prop({ type: String, required: true })
  publicId: string;
  
  @ApiProperty({ description: 'Image folder', example: 'Clients' })
  @Prop({ type: String, required: true })
  folder: string;
  
  @ApiProperty({ description: 'Image format', example: 'jpg' })
  @Prop({ type: String, required: true })
  format: string;
  
  @ApiProperty({ description: 'Image bytes', example: '1024' })
  @Prop({ type: Number, required: true })
  bytes: number;
  
  @ApiProperty({ description: 'Image width', example: '576' })
  @Prop({ type: Number, required: true })
  width: number;
  
  @ApiProperty({ description: 'Image height', example: '1024' })
  @Prop({ type: Number, required: true })
  height: number;
  
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

export const ImageSchema = SchemaFactory.createForClass( Image )
ImageSchema.plugin(mongoosePaginate)
