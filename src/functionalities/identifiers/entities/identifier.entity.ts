import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { ApiProperty } from '@nestjs/swagger'
import * as mongoosePaginate from 'mongoose-paginate-v2'

@Schema()
export class Identifier extends Document {
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ example: true, description: 'Indicates if is an active identifier or not.' })
  isActive: boolean;
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'ID001', description: 'Identifier code' })
  code: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'RUT', description: 'Identifier name' })
  name: string
  
  @Prop({ type: String, required: true })
  @ApiProperty({ example: 'XX.XXX.XXX-X', description: 'Identifier format.' })
  format: string
  
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

export const IdentifierSchema = SchemaFactory.createForClass( Identifier )
IdentifierSchema.plugin(mongoosePaginate)