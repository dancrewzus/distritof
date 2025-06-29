import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Currency, CurrencySchema } from '../currencies/entities/currency.entity';
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { License, LicenseSchema } from './entities/license.entity';
import { LicensesController } from './licenses.controller'
import { CommonModule } from '../../common/common.module'
import { LicensesService } from './licenses.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ LicensesController ],
  providers: [ LicensesService ],
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
        name: Currency.name,
        schema: CurrencySchema
      },
      {
        name: License.name,
        schema: LicenseSchema
      },
    ], 'default')
  ], 
  exports: [ LicensesService ]
})
export class LicensesModule {}
