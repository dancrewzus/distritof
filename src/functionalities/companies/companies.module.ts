import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CompanyLicense, CompanyLicenseSchema } from './entities/company-license.entity'
import { UserCompany, UserCompanySchema } from '../users/entities/userCompany.entity'
import { Currency, CurrencySchema } from '../currencies/entities/currency.entity'
import { Country, CountrySchema } from '../countries/entities/country.entity'
import { License, LicenseSchema } from '../licenses/entities/license.entity'
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { Company, CompanySchema } from './entities/company.entity'
import { User, UserSchema } from '../users/entities/user.entity'
import { CompaniesController } from './companies.controller'
import { CommonModule } from '../../common/common.module'
import { CompaniesService } from './companies.service'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'
import { UserData, UserDataSchema } from '../users/entities/userData.entity';
import { Role, RoleSchema } from '../roles/entities/role.entity';
import { Parameter, ParameterSchema } from '../parameters/entities/parameter.entity';
import { City, CitySchema } from '../cities/entities/city.entity';

@Module({
  controllers: [ CompaniesController ],
  providers: [ CompaniesService ],
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
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: UserData.name,
        schema: UserDataSchema,
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
      {
        name: CompanyLicense.name,
        schema: CompanyLicenseSchema
      },
      {
        name: Country.name,
        schema: CountrySchema
      },
      {
        name: City.name,
        schema: CitySchema
      },
      {
        name: Currency.name,
        schema: CurrencySchema
      },
      {
        name: License.name,
        schema: LicenseSchema
      },
      {
        name: UserCompany.name,
        schema: UserCompanySchema
      },
      {
        name: Parameter.name,
        schema: ParameterSchema
      },
    ], 'default')
  ], 
  exports: [ CompaniesService ]
})
export class CompaniesModule {}
