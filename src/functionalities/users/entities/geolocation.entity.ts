import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

import { User } from 'src/functionalities/users/entities/user.entity';

@Schema()
export class Geolocation extends Document {
  
  @ApiProperty({ type: String, description: 'Client ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  client: User;

  @ApiProperty({ example: -1.123456789, description: 'Client location latitude.' })
  @Prop({ type: Number, required: true })
  latitude: number;

  @ApiProperty({ example: 1.123456789, description: 'Client location longitude.' })
  @Prop({ type: Number, required: true })
  longitude: number;
  
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

export const GeolocationSchema = SchemaFactory.createForClass( Geolocation )