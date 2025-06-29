import { Module } from '@nestjs/common'

import { PaymentModalitiesModule } from './modalities/payment-modalities.module'
import { ContractPaymentsModule } from './contract-payments/payments.module'
import { NeighborhoodsModule } from './neighborhoods/neighborhoods.module'
import { NotificationsModule } from './notifications/notifications.module'
import { ContractPendingModule } from './contract-pending/pending.module'
import { IdentifiersModule } from './identifiers/identifiers.module'
import { CurrenciesModule } from './currencies/currencies.module'
import { ParametersModule } from './parameters/parameters.module'
import { CompaniesModule } from './companies/companies.module'
import { CountriesModule } from './countries/countries.module'
import { ContractsModule } from './contracts/contracts.module'
import { MovementsModule } from './movements/movements.module'
import { LicensesModule } from './licenses/licenses.module'
import { HolidaysModule } from './holidays/holidays.module'
import { NotesModule } from './contract-notes/notes.module'
import { ArrearsModule } from './arrears/arrears.module'
import { ImagesModule } from './images/images.module'
import { TracksModule } from './tracks/tracks.module'
import { CitiesModule } from './cities/cities.module'
import { RoutesModule } from './routes/routes.module'
import { RolesModule } from './roles/roles.module'
import { UsersModule } from './users/users.module'
import { PaymentsModule } from './payments/payments.module'

@Module({
  imports: [
    NotesModule,
    ContractsModule,
    PaymentsModule,
    MovementsModule,
    CompaniesModule,
    ParametersModule,
    ContractPendingModule,
    CountriesModule,
    CitiesModule,
    NeighborhoodsModule,
    CurrenciesModule,
    HolidaysModule,
    IdentifiersModule,
    RoutesModule,
    ImagesModule,
    LicensesModule,
    PaymentModalitiesModule,
    ArrearsModule,
    NotificationsModule,
    RolesModule,
    TracksModule,
    UsersModule,
    PaymentsModule,
    ContractPaymentsModule,
  ],
  exports: [ ],
})
export class FunctionalitiesModule {}
