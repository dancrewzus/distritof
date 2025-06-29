import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Contract, ContractSchema } from '../contracts/entities/contracts.entity';
import { Movement, MovementSchema } from '../movements/entities/movement.entity';
import { Image, ImageSchema } from '../images/entities/image.entity';
import { ContractPayment, ContractPaymentSchema } from './entities/payment.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { PaymentsController } from './payments.controller';
import { CommonModule } from 'src/common/common.module';
import { PaymentsService } from './payments.service';
import { AuthModule } from 'src/auth/auth.module';
import { Geolocation, GeolocationSchema } from '../users/entities/geolocation.entity';
import { ContractPending, ContractPendingSchema } from '../contract-pending/entities/pending.entity';
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { Parameter, ParameterSchema } from '../parameters/entities/parameter.entity';
import { Route, RouteSchema } from '../routes/entities/route.entity';
import { Track, TrackSchema } from '../tracks/entities/track.entity';
import { ContractUtils } from '../contracts/utils/contract.utils';
import { ImagesService } from '../images/images.service';
import { NotificationSchema, Notification } from '../notifications/entities/notification.entity';
import { NotificationUser, NotificationUserSchema } from '../notifications/entities/user-notification.entity';
import { UserCompany, UserCompanySchema } from '../users/entities/userCompany.entity';
import { Role, RoleSchema } from '../roles/entities/role.entity';

@Module({
  controllers: [ PaymentsController ],
  providers: [ PaymentsService, ImagesService, ContractUtils ],
  imports: [
    AuthModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Movement.name,
        schema: MovementSchema
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
        name: Notification.name,
        schema: NotificationSchema
      },
      {
        name: NotificationUser.name,
        schema: NotificationUserSchema
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
        name: Geolocation.name,
        schema: GeolocationSchema
      },
      {
        name: ContractPayment.name,
        schema: ContractPaymentSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: Contract.name,
        schema: ContractSchema
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
        name: Image.name,
        schema: ImageSchema
      },
      {
        name: ContractPending.name,
        schema: ContractPendingSchema
      },
    ], 'default')
  ]
})
export class ContractPaymentsModule {}
