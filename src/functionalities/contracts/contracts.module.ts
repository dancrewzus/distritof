import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'

// import { Payment, PaymentSchema } from '../payments/entities/payment.entity'
// import { ContractNote, ContractNoteSchema } from './entities/notes.entity'

import { PaymentModality, PaymentModalitySchema } from 'src/functionalities/modalities/entities/payment-modality.entity'
import { ContractNote, ContractNoteSchema } from 'src/functionalities/contract-notes/entities/note.entity'
import { Parameter, ParameterSchema } from 'src/functionalities/parameters/entities/parameter.entity'
import { ContractPayment, ContractPaymentSchema } from '../contract-payments/entities/payment.entity'
import { ContractPending, ContractPendingSchema } from '../contract-pending/entities/pending.entity'
import { Movement, MovementSchema } from 'src/functionalities/movements/entities/movement.entity'
import { Company, CompanySchema } from 'src/functionalities/companies/entities/company.entity'
import { Holiday, HolidaySchema } from 'src/functionalities/holidays/entities/holiday.entity'
import { Image, ImageSchema } from 'src/functionalities/images/entities/image.entity'
import { Route, RouteSchema } from 'src/functionalities/routes/entities/route.entity'
import { Track, TrackSchema } from 'src/functionalities/tracks/entities/track.entity'
import { UserCompany, UserCompanySchema } from '../users/entities/userCompany.entity'
import { MovementsService } from 'src/functionalities/movements/movements.service'
import { User, UserSchema } from 'src/functionalities/users/entities/user.entity'
import { ImagesService } from 'src/functionalities/images/images.service'
import { Contract, ContractSchema } from './entities/contracts.entity'
import { Role, RoleSchema } from '../roles/entities/role.entity'
import { ContractsController } from './contracts.controller'
import { CommonModule } from 'src/common/common.module'
import { ContractsService } from './contracts.service'
import { ContractUtils } from './utils/contract.utils'
import { AuthModule } from 'src/auth/auth.module'
import { Notification, NotificationSchema } from '../notifications/entities/notification.entity'
import { NotificationUser, NotificationUserSchema } from '../notifications/entities/user-notification.entity'

@Module({
  controllers: [ ContractsController ],
  providers: [ ContractsService, MovementsService, ImagesService, ContractUtils ],
  imports: [
    AuthModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: PaymentModality.name,
        schema: PaymentModalitySchema,
      },
      {
        name: UserCompany.name,
        schema: UserCompanySchema
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
        schema: ContractSchema,
      },
      {
        name: Parameter.name,
        schema: ParameterSchema,
      },
      {
        name: Movement.name,
        schema: MovementSchema,
      },
      {
        name: Company.name,
        schema: CompanySchema,
      },
      {
        name: ContractNote.name,
        schema: ContractNoteSchema,
      },
      {
        name: Holiday.name,
        schema: HolidaySchema,
      },
      {
        name: Track.name,
        schema: TrackSchema,
      },
      {
        name: Route.name,
        schema: RouteSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: Image.name,
        schema: ImageSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
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
    ], 'default')
  ]
})
export class ContractsModule {}
