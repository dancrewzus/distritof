import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Company, CompanySchema } from '../companies/entities/company.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { Holiday, HolidaySchema } from './entities/holiday.entity'
import { HolidaysController } from './holidays.controller'
import { CommonModule } from '../../common/common.module'
import { HolidaysService } from './holidays.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ HolidaysController ],
  providers: [ HolidaysService ],
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
        name: Holiday.name,
        schema: HolidaySchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
    ], 'default')
  ], 
  exports: [ HolidaysService ]
})
export class HolidaysModule {}
