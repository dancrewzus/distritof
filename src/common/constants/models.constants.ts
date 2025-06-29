import { PaymentModality, PaymentModalitySchema } from 'src/functionalities/modalities/entities/payment-modality.entity'
import { CompanyLicense, CompanyLicenseSchema } from 'src/functionalities/companies/entities/company-license.entity'
import { Neighborhood, NeighborhoodSchema } from 'src/functionalities/neighborhoods/entities/neighborhood.entity'
import { Notification, NotificationSchema } from 'src/functionalities/notifications/entities/notification.entity'
import { Identifier, IdentifierSchema } from 'src/functionalities/identifiers/entities/identifier.entity'
import { UserCompany, UserCompanySchema } from 'src/functionalities/users/entities/userCompany.entity'
import { Currency, CurrencySchema } from 'src/functionalities/currencies/entities/currency.entity'
import { Company, CompanySchema } from 'src/functionalities/companies/entities/company.entity'
import { Country, CountrySchema } from 'src/functionalities/countries/entities/country.entity'
import { UserData, UserDataSchema } from 'src/functionalities/users/entities/userData.entity'
import { License, LicenseSchema } from 'src/functionalities/licenses/entities/license.entity'
import { Holiday, HolidaySchema } from 'src/functionalities/holidays/entities/holiday.entity'
import { Arrear, ArrearSchema } from 'src/functionalities/arrears/entities/arrear.entity'
import { Track, TrackSchema } from 'src/functionalities/tracks/entities/track.entity'
import { Image, ImageSchema } from 'src/functionalities/images/entities/image.entity'
import { Route, RouteSchema } from 'src/functionalities/routes/entities/route.entity'
import { City, CitySchema } from 'src/functionalities/cities/entities/city.entity'
import { Role, RoleSchema } from 'src/functionalities/roles/entities/role.entity'
import { User, UserSchema } from 'src/functionalities/users/entities/user.entity'
import { ContractNote, ContractNoteSchema } from 'src/functionalities/contract-notes/entities/note.entity'
import { ContractPayment, ContractPaymentSchema } from 'src/functionalities/contract-payments/entities/payment.entity'
import { ContractPending, ContractPendingSchema } from 'src/functionalities/contract-pending/entities/pending.entity'
import { Contract, ContractSchema } from 'src/functionalities/contracts/entities/contracts.entity'
import { Movement, MovementSchema } from 'src/functionalities/movements/entities/movement.entity'
import { Parameter, ParameterSchema } from 'src/functionalities/parameters/entities/parameter.entity'
import { Payment, PaymentsSchema } from 'src/functionalities/payments/entities/payment.entity'
import { RouteUser, RouteUserSchema } from 'src/functionalities/routes/entities/routeUser.entity'
import { Geolocation, GeolocationSchema } from 'src/functionalities/users/entities/geolocation.entity'
import { DailyResume, DailyResumeSchema } from 'src/functionalities/movements/entities/daily-resume.entity'

export const MODELS = [
  {
    name: Arrear.name,
    schema: ArrearSchema
  },
  {
    name: City.name,
    schema: CitySchema
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
    name: Currency.name,
    schema: CurrencySchema
  },
  {
    name: Holiday.name,
    schema: HolidaySchema
  },
  {
    name: Identifier.name,
    schema: IdentifierSchema
  },
  {
    name: Image.name,
    schema: ImageSchema
  },
  {
    name: License.name,
    schema: LicenseSchema
  },
  {
    name: PaymentModality.name,
    schema: PaymentModalitySchema
  },
  {
    name: Neighborhood.name,
    schema: NeighborhoodSchema
  },
  {
    name: Notification.name,
    schema: NotificationSchema
  },
  {
    name: Role.name,
    schema: RoleSchema
  },
  {
    name: Route.name,
    schema: RouteSchema
  },
  {
    name: Track.name,
    schema: TrackSchema
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
    name: UserCompany.name,
    schema: UserCompanySchema
  },

  {
    name: ContractNote.name,
    schema: ContractNoteSchema
  },
  {
    name: ContractPayment.name,
    schema: ContractPaymentSchema
  },
  {
    name: ContractPending.name,
    schema: ContractPendingSchema
  },
  {
    name: Contract.name,
    schema: ContractSchema
  },
  {
    name: Geolocation.name,
    schema: GeolocationSchema
  },
  {
    name: Movement.name,
    schema: MovementSchema
  },
  {
    name: Parameter.name,
    schema: ParameterSchema
  },
  {
    name: Payment.name,
    schema: PaymentsSchema
  },
  {
    name: RouteUser.name,
    schema: RouteUserSchema
  },
  {
    name: DailyResume.name,
    schema: DailyResumeSchema
  },
]