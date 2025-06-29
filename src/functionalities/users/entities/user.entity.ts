import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger';

import { Identifier } from 'src/functionalities/identifiers/entities/identifier.entity';
import { Country } from 'src/functionalities/countries/entities/country.entity';
import { Track } from 'src/functionalities/tracks/entities/track.entity';
import { Role } from 'src/functionalities/roles/entities/role.entity';
import { UserCompany } from './userCompany.entity';
import { UserData } from './userData.entity';
import { RouteUser } from 'src/functionalities/routes/entities/routeUser.entity';

@Schema()
export class User extends Document {

  @Prop({ type: String, required: true })
  firstName: string;
  
  @Prop({ type: String, required: true })
  paternalSurname: string;

  @Prop({ type: String, required: false, default: '' })
  identifier: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Identifier', required: false, default: null })
  identifierType: Identifier;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Country', required: true })
  country: Country;

  @Prop({ type: String, required: false, unique: true, nullable: true })
  @ApiProperty({
    example: 'adumbledore@howarts.magic',
    description: 'User email.',
    uniqueItems: true
  })
  email: string;

  @Prop({ type: String, required: true })
  password: string;
  
  @Prop({ type: Boolean, default: false })
  isSuperUser: boolean;
  
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isLogged: boolean;

  @Prop({ type: String, default: '' })
  recoveryCode: string;
  
  @Prop({ type: String, required: true })
  validationCode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role', required: true })
  role: Role;

  @ApiProperty({ description: 'List of companies that are related to this user.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserCompany' }], select: false, default: [] })
  companies: UserCompany[]

  @ApiProperty({ description: 'List of routes that are related to this user.', type: [String] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'RouteUser' }], select: false, default: [] })
  routes: RouteUser[];

  @ApiProperty({ description: 'List of tracks that user is registered.', type: [ String ] })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Track' }], select: false, default: [] })
  tracks: Track[]

  @ApiProperty({ type: String, description: 'User creator ID', example: '6472d32b20f00d485b965c1e' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false, default: null, nullable: true })
  createdBy: User;
  
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserData', required: false, default: null, nullable: true })
  userData: UserData;

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

export const UserSchema = SchemaFactory.createForClass( User )
UserSchema.plugin(mongoosePaginate)
