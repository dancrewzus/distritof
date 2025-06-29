import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Company, CompanySchema } from '../companies/entities/company.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { Arrear, ArrearSchema } from './entities/arrear.entity'
import { ArrearsController } from './arrears.controller'
import { CommonModule } from '../../common/common.module'
import { ArrearsService } from './arrears.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ ArrearsController ],
  providers: [ ArrearsService ],
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
        name: Arrear.name,
        schema: ArrearSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
    ], 'default')
  ], 
  exports: [ ArrearsService ]
})
export class ArrearsModule {}
