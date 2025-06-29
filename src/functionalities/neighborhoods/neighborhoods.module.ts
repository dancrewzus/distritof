import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CommonModule } from '../../common/common.module'
import { Neighborhood, NeighborhoodSchema } from './entities/neighborhood.entity'
import { NeighborhoodsController } from './neighborhoods.controller'
import { NeighborhoodsService } from './neighborhoods.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { City, CitySchema } from '../cities/entities/city.entity';

@Module({
  controllers: [ NeighborhoodsController ],
  providers: [ NeighborhoodsService ],
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
        name: Neighborhood.name,
        schema: NeighborhoodSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
    ], 'default')
  ], 
  exports: [ NeighborhoodsService ]
})
export class NeighborhoodsModule {}
