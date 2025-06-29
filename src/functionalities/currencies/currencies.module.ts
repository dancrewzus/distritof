import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Currency, CurrencySchema } from './entities/currency.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CurrenciesController } from './currencies.controller'
import { CurrenciesService } from './currencies.service'
import { CommonModule } from '../../common/common.module'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ CurrenciesController ],
  providers: [ CurrenciesService ],
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
    ], 'default')
  ], 
  exports: [ CurrenciesService ]
})
export class CurrenciesModule {}
