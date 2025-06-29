import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Parameter, ParameterSchema } from 'src/functionalities/parameters/entities/parameter.entity'
import { Company, CompanySchema } from '../companies/entities/company.entity'
import { UserData, UserDataSchema } from './entities/userData.entity'
import { Image, ImageSchema } from '../images/entities/image.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { Role, RoleSchema } from '../roles/entities/role.entity'
import { User, UserSchema } from './entities/user.entity'
import { CommonModule } from '../../common/common.module'
import { UsersController } from './users.controller'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'

import { UsersCompanyAdministratorsService } from './services/users-company-administrators.service';
import { UsersCompanySupervisorsService } from './services/users-company-supervisors.service';
import { UsersCompanyWorkersService } from './services/users-company-workers.service';
import { UsersCompanyClientsService } from './services/users-company-clients.service';
import { UsersAdministratorsService } from './services/users-administrators.service';
import { UserCompany, UserCompanySchema } from './entities/userCompany.entity';
import { UsersCompanyOwnersService } from './services/users-company-owners.service';
import { Route, RouteSchema } from '../routes/entities/route.entity';
import { City, CitySchema } from '../cities/entities/city.entity';
import { UsersService } from './services/users.service';
import { RouteUser, RouteUserSchema } from '../routes/entities/routeUser.entity';
import { UserUtils } from './utils/user.utils';
import { ImagesService } from '../images/images.service';

@Module({
  controllers: [ UsersController ],
  providers: [
    UsersAdministratorsService,
    UsersCompanyOwnersService,
    UsersCompanyAdministratorsService,
    UsersCompanySupervisorsService,
    UsersCompanyWorkersService,
    UsersCompanyClientsService,
    ImagesService,
    UsersService,
    UserUtils,
  ],
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
        name: User.name,
        schema: UserSchema
      },
      {
        name: UserData.name,
        schema: UserDataSchema
      },
      {
        name: Image.name,
        schema: ImageSchema
      },
      {
        name: Role.name,
        schema: RoleSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
      {
        name: UserCompany.name,
        schema: UserCompanySchema
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
        name: RouteUser.name,
        schema: RouteUserSchema
      },
      {
        name: Parameter.name,
        schema: ParameterSchema
      },
    ], 'default')
  ], 
  exports: [
    UsersAdministratorsService,
    UsersCompanyOwnersService,
    UsersCompanyAdministratorsService,
    UsersCompanySupervisorsService,
    UsersCompanyWorkersService,
    UsersCompanyClientsService,
    UsersService,
  ]
})
export class UsersModule {}
