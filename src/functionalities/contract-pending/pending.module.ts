import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { ContractPending, ContractPendingSchema } from './entities/pending.entity'
import { Contract, ContractSchema } from '../contracts/entities/contracts.entity'
import { Company, CompanySchema } from '../companies/entities/company.entity'
import { Route, RouteSchema } from '../routes/entities/route.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { ContractUtils } from '../contracts/utils/contract.utils'
import { User, UserSchema } from '../users/entities/user.entity'
import { CommonModule } from '../../common/common.module'
import { PendingController } from './pending.controller'
import { RolesModule } from '../roles/roles.module'
import { PendingService } from './pending.service'
import { AuthModule } from 'src/auth/auth.module'

@Module({
  controllers: [ PendingController ],
  providers: [ PendingService, ContractUtils ],
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
        name: ContractPending.name,
        schema: ContractPendingSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
      {
        name: Route.name,
        schema: RouteSchema
      },
      {
        name: Contract.name,
        schema: ContractSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
    ], 'default')
  ], 
  exports: [ PendingService ]
})
export class ContractPendingModule {}
