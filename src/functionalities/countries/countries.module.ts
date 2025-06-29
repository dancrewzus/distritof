import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Country, CountrySchema } from './entities/country.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CountriesController } from './countries.controller'
import { CountriesService } from './countries.service'
import { CommonModule } from '../../common/common.module'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ CountriesController ],
  providers: [ CountriesService ],
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
        name: Country.name,
        schema: CountrySchema
      },
    ], 'default')
  ], 
  exports: [ CountriesService ]
})
export class CountriesModule {}
