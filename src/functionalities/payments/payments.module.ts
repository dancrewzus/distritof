import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";


import { Company, CompanySchema } from "../companies/entities/company.entity";
import { CompanyLicense, CompanyLicenseSchema } from "../companies/entities/company-license.entity";
import { License, LicenseSchema } from "../licenses/entities/license.entity";
import { AuthModule } from "src/auth/auth.module";
import { RolesModule } from "../roles/roles.module";
import { CommonModule } from "src/common/common.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { CompaniesService } from "../companies/companies.service";
import { LicensesService } from "../licenses/licenses.service";
import { User, UserSchema } from "../users/entities/user.entity";
import { UserCompany, UserCompanySchema } from "../users/entities/userCompany.entity";
import { Country, CountrySchema } from "../countries/entities/country.entity";
import { Track, TrackSchema } from "../tracks/entities/track.entity";
import { Payment, PaymentsSchema } from "./entities/payment.entity";
import { Currency, CurrencySchema } from "../currencies/entities/currency.entity";
import { ImagesService } from "../images/images.service";
import { Image, ImageSchema } from "../images/entities/image.entity";
import { UserData, UserDataSchema } from "../users/entities/userData.entity";
import { Role, RoleSchema } from "../roles/entities/role.entity";
import { Parameter, ParameterSchema } from "../parameters/entities/parameter.entity";
import { City, CitySchema } from "../cities/entities/city.entity";

@Module({
  controllers: [ PaymentsController ],
  providers: [ PaymentsService, CompaniesService, LicensesService, ImagesService ],
  imports: [
    AuthModule,
    RolesModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Image.name,
        schema: ImageSchema,
      },
      {
        name: Payment.name,
        schema: PaymentsSchema,
      },
      {
        name: Currency.name,
        schema: CurrencySchema
      },
      {
        name: Track.name,
        schema: TrackSchema
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
        name: License.name,
        schema: LicenseSchema
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
        name: User.name,
        schema: UserSchema
      },
      {
        name: UserData.name,
        schema: UserDataSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
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
  exports: [ PaymentsService ],
})
export class PaymentsModule {}