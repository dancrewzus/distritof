import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { CommonModule } from '../../common/common.module'
import { Route, RouteSchema } from './entities/route.entity'
import { RoutesController } from './routes.controller'
import { RoutesService } from './routes.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { City, CitySchema } from '../cities/entities/city.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { UserData, UserDataSchema } from '../users/entities/userData.entity';
import { RouteUser, RouteUserSchema } from './entities/routeUser.entity';
import { Contract, ContractSchema } from '../contracts/entities/contracts.entity';

@Module({
  controllers: [ RoutesController ],
  providers: [ RoutesService ],
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
        name: Route.name,
        schema: RouteSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
      {
        name: Contract.name,
        schema: ContractSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: UserData.name,
        schema: UserDataSchema
      },
      {
        name: RouteUser.name,
        schema: RouteUserSchema
      },
    ], 'default')
  ], 
  exports: [ RoutesService ]
})
export class RoutesModule {}
