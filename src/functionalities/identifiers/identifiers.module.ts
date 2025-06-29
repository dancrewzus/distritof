import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Identifier, IdentifierSchema } from './entities/identifier.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { IdentifiersController } from './identifiers.controller'
import { IdentifiersService } from './identifiers.service'
import { CommonModule } from '../../common/common.module'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ IdentifiersController ],
  providers: [ IdentifiersService ],
  imports: [
    AuthModule,
    RolesModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Track.name,
        schema: TrackSchema
      },
      {
        name: Identifier.name,
        schema: IdentifierSchema
      },
    ], 'default')
  ], 
  exports: [ IdentifiersService ]
})
export class IdentifiersModule {}
