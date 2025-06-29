import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

import { Image } from 'src/functionalities/images/entities/image.entity';
import { City } from 'src/functionalities/cities/entities/city.entity';
import { Geolocation } from './geolocation.entity';
import { User } from './user.entity';

@Schema()
export class UserData extends Document {

  @Prop({ type: String, required: false, default: 'system' })
  gender: string;
  
  @Prop({ type: String, required: false, default: '' })
  residenceAddress: string;
  
  @Prop({ type: String, required: false, default: '' })
  billingAddress: string;
  
  @Prop({ type: String, required: false, default: '' })
  phoneNumber: string;
  
  @Prop({ type: String, required: false, default: '' })
  securityQuestion: string;
  
  @Prop({ type: String, required: false, default: '' })
  securityAnswer: string;
  
  @Prop({ type: Number, required: false, default: 3 })
  points: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Image', required: false, default: null })
  profilePicture: Image;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Image', required: false, default: null })
  addressPicture: Image;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Image', required: false, default: null })
  identifierPicture?: Image;

  @ApiProperty({ example: '01/01/1900', description: 'Identifier expire date.' })
  @Prop({ type: String, default: null, nullable: true })
  identifierExpireDate?: string;

  @ApiProperty({ example: '01/01/1900', description: 'User entry date.' })
  @Prop({ type: String, default: null, nullable: true })
  entryDate?: string;
  
  @ApiProperty({ example: '', description: 'User last geolocation.' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Geolocation', required: false, default: null })
  geolocation?: Geolocation;

  @ApiProperty({ description: 'List of cities that are related to this user.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'City' }], select: false, default: [] })
  cities: City[];
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

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

export const UserDataSchema = SchemaFactory.createForClass( UserData )
