import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentModality, PaymentModalitySchema } from './entities/payment-modality.entity';
import { PaymentModalitiesController } from './payment-modalities.controller';
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { PaymentModalitiesService } from './payment-modalities.service';
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CommonModule } from '../../common/common.module'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ PaymentModalitiesController ],
  providers: [ PaymentModalitiesService ],
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
        name: PaymentModality.name,
        schema: PaymentModalitySchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
    ], 'default')
  ], 
  exports: [ PaymentModalitiesService ]
})
export class PaymentModalitiesModule {}
