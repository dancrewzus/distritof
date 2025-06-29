import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CommonModule } from '../../common/common.module'
import { Parameter, ParameterSchema } from './entities/parameter.entity'
import { ParametersController } from './parameters.controller'
import { ParametersService } from './parameters.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'
import { Company, CompanySchema } from '../companies/entities/company.entity';

@Module({
  controllers: [ ParametersController ],
  providers: [ ParametersService ],
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
        name: Parameter.name,
        schema: ParameterSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
    ], 'default')
  ], 
  exports: [ ParametersService ]
})
export class ParametersModule {}
