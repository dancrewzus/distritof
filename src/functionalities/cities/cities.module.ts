import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CommonModule } from '../../common/common.module'
import { City, CitySchema } from './entities/city.entity'
import { CitiesController } from './cities.controller'
import { CitiesService } from './cities.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { Country, CountrySchema } from '../countries/entities/country.entity';

@Module({
  controllers: [ CitiesController ],
  providers: [ CitiesService ],
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
        name: City.name,
        schema: CitySchema
      },
      {
        name: Country.name,
        schema: CountrySchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
    ], 'default')
  ], 
  exports: [ CitiesService ]
})
export class CitiesModule {}
