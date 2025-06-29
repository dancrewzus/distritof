import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'

// import { ContractStatus, ContractStatusSchema } from '../contracts/entities/contractStatus.entity'
// import { Holiday, HolidaySchema } from 'src/functionalities/holidays/entities/holiday.entity'
// import { ContractNote, ContractNoteSchema } from '../contracts/entities/notes.entity'
// import { DailyResume, DailyResumeSchema } from './entities/daily-resume.entity'
// import { Payment, PaymentSchema } from '../payments/entities/payment.entity'
// import { GeolocationSchema, Geolocation } from './entities/location.entity'
// import { PaymentsService } from '../payments/payments.service'

import { PaymentModality, PaymentModalitySchema } from 'src/functionalities/modalities/entities/payment-modality.entity'
import { ContractPayment, ContractPaymentSchema } from '../contract-payments/entities/payment.entity'
import { ContractPending, ContractPendingSchema } from '../contract-pending/entities/pending.entity'
import { Contract, ContractSchema } from 'src/functionalities/contracts/entities/contracts.entity'
import { Company, CompanySchema } from 'src/functionalities/companies/entities/company.entity'
import { Holiday, HolidaySchema } from 'src/functionalities/holidays/entities/holiday.entity'
import { Image, ImageSchema } from 'src/functionalities/images/entities/image.entity'
import { Route, RouteSchema } from 'src/functionalities/routes/entities/route.entity'
import { Track, TrackSchema } from 'src/functionalities/tracks/entities/track.entity'
import { Parameter, ParameterSchema } from '../parameters/entities/parameter.entity'
import { ContractsService } from 'src/functionalities/contracts/contracts.service'
import { Role, RoleSchema } from 'src/functionalities/roles/entities/role.entity'
import { User, UserSchema } from 'src/functionalities/users/entities/user.entity'
import { ImagesService } from 'src/functionalities/images/images.service'
import { Movement, MovementSchema } from './entities/movement.entity'
import { ContractUtils } from '../contracts/utils/contract.utils'
import { MovementsController } from './movements.controller'
import { CommonModule } from 'src/common/common.module'
import { MovementsService } from './movements.service'
import { AuthModule } from 'src/auth/auth.module'
import { ContractNote, ContractNoteSchema } from '../contract-notes/entities/note.entity'
import { UserCompany, UserCompanySchema } from '../users/entities/userCompany.entity'
import { Notification, NotificationSchema } from '../notifications/entities/notification.entity'
import { NotificationUser, NotificationUserSchema } from '../notifications/entities/user-notification.entity'

@Module({
  controllers: [ MovementsController ],
  providers: [ MovementsService, ContractsService, ImagesService, ContractUtils /*, PaymentsService */ ],
  imports: [
    AuthModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Parameter.name,
        schema: ParameterSchema
      },
      {
        name: Notification.name,
        schema: NotificationSchema
      },
      {
        name: NotificationUser.name,
        schema: NotificationUserSchema
      },
      {
        name: Contract.name,
        schema: ContractSchema
      },
      {
        name: Movement.name,
        schema: MovementSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
      {
        name: Image.name,
        schema: ImageSchema
      },
      {
        name: Track.name,
        schema: TrackSchema
      },
      {
        name: Route.name,
        schema: RouteSchema
      },
      {
        name: Role.name,
        schema: RoleSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
      // FROM CONTRACTS
      {
        name: PaymentModality.name,
        schema: PaymentModalitySchema,
      },
      {
        name: Holiday.name,
        schema: HolidaySchema,
      },
      {
        name: ContractPending.name,
        schema: ContractPendingSchema
      },
      {
        name: ContractPayment.name,
        schema: ContractPaymentSchema
      },
      {
        name: ContractNote.name,
        schema: ContractNoteSchema
      },
      {
        name: UserCompany.name,
        schema: UserCompanySchema
      },
    ], 'default')
  ],
  exports: [ MovementsService ]
})
export class MovementsModule {}
