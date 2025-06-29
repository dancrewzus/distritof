import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2'
import { ApiProperty } from '@nestjs/swagger'

import { Company } from 'src/functionalities/companies/entities/company.entity';

@Schema()
export class Parameter extends Document {

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: false, default: '' })
  @ApiProperty({ example: '654ef654654r', description: 'City company owner.' })
  company: Company;
  
  @ApiProperty({ example: 3, description: 'Days to cancel automatic requests.' })
  @Prop({ type: Number, default: 3 })
  daysToCancelAutomaticRequests: number;

  @ApiProperty({ example: 3, description: 'Days to generate automatic requests.' })
  @Prop({ type: Number, default: 3 })
  daysToGenerateAutomaticRequests: number;

  @ApiProperty({ example: false, description: 'Indicates whether quota settings are handled manually.' })
  @Prop({ type: Boolean, default: false })
  isManualValues: boolean;

  @ApiProperty({ example: 2, description: 'Minimum daily installments to show as yellow.' })
  @Prop({ type: Number, default: 3 })
  minimumInstallmentsYellowDaily: number;

  @ApiProperty({ example: 1, description: 'Minimum weekly installments to show as yellow.' })
  @Prop({ type: Number, default: 1 })
  minimumInstallmentsYellowWeekly: number;

  @ApiProperty({ example: 2, description: 'Minimum biweekly installments to show as yellow.' })
  @Prop({ type: Number, default: 2 })
  minimumInstallmentsYellowBiweekly: number;

  @ApiProperty({ example: 2, description: 'Minimum monthly installments to show as yellow.' })
  @Prop({ type: Number, default: 2 })
  minimumInstallmentsYellowMonthly: number;

  @ApiProperty({ example: 4, description: 'Minimum daily installments to show as red.' })
  @Prop({ type: Number, default: 4 })
  minimumInstallmentsRedDaily: number;

  @ApiProperty({ example: 2, description: 'Minimum weekly installments to show as red.' })
  @Prop({ type: Number, default: 2 })
  minimumInstallmentsRedWeekly: number;

  @ApiProperty({ example: 4, description: 'Minimum biweekly installments to show as red.' })
  @Prop({ type: Number, default: 4 })
  minimumInstallmentsRedBiweekly: number;

  @ApiProperty({ example: 4, description: 'Minimum monthly installments to show as red.' })
  @Prop({ type: Number, default: 4 })
  minimumInstallmentsRedMonthly: number;

  @ApiProperty({ example: true, description: 'Indicates if mobile client creation is allowed.' })
  @Prop({ type: Boolean, default: true })
  allowsMobileClientCreation: boolean;

  @ApiProperty({ example: false, description: 'Indicates if simultaneous credits are allowed for a client.' })
  @Prop({ type: Boolean, default: false })
  allowsSimultaneousCreditsForClient: boolean;

  @ApiProperty({ example: 0, description: 'Interest rate for late payments.' })
  @Prop({ type: Number, default: 0 })
  interestRateForLatePayment: number;

  @ApiProperty({ example: false, description: 'Indicates if the next payment date should be scheduled for mobile.' })
  @Prop({ type: Boolean, default: false })
  scheduleNextMobilePaymentDate: boolean;

  @ApiProperty({ example: false, description: 'Indicates if client quota validation is required.' })
  @Prop({ type: Boolean, default: false })
  validateClientQuota: boolean;

  @ApiProperty({ example: 30, description: 'Default maximum debt days for a client.' })
  @Prop({ type: Number, default: 30 })
  defaultMaxClientDebtDays: number;

  @ApiProperty({ example: '07:00:00', description: 'Journal start hour (24h format HH:mm:ss).' })
  @Prop({ type: String, default: '07:00:00' })
  journalStart: string;

  @ApiProperty({ example: '21:00:00', description: 'Journal end hour (24h format HH:mm:ss).' })
  @Prop({ type: String, default: '21:00:00' })
  journalEnd: string;

  
  // OPTIONS 
  // GENERAL 

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Indicates whether the system can handle numeric values without the thousands separator.' })
  handleValuesWithoutThousands: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: "Allows editing the customer's phone number once registered." })
  allowEditCustomerPhone: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: "Verifies the validity of the customer's ID document when creating or updating their profile." })
  validateCustomerDocument: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Allows creating the same customer in multiple routes or locations.' })
  allowCreateCustomerOnMultipleRoutes: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Enables the option to list responsible parties (causers) in the mobile application.' })
  listCausersOnMobile: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Indicates whether the system can handle co-signers on a credit application.' })
  handleCoSigners: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Indicates whether the system should validate the GPS location in the mobile application.' })
  validateGpsOnMobile: boolean;

  @Prop({ type: Number, default: 5 })
  @ApiProperty({ type: Number, example: 6, description: 'Defines the maximum number of days allowed to cancel a transaction or request.' })
  maxDaysForCancellation: number

  // CREDITS 

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Allows creating credits without the need for a formal prior request.' })
  allowCreateCreditWithoutRequest: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Indicates whether the system handles verification codes in the request process.' })
  handleVerificationCodeInRequest: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Verifies the validity of credits granted directly without intermediaries.' })
  verifyDirectCredits: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Indicates if late fees will be applied in the next billing cycle.' })
  chargeLateFeeOnNextCycle: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Allows applying additional charges on certain transactions.' })
  applyAdditionalCharge: boolean;

  @Prop({ type: Number, default: 0 })
  @ApiProperty({ type: Number, example: 10, description: 'Defines the monetary value assigned to each visit made.' })
  valuePerVisit: number

  @Prop({ type: Number, default: 100 })
  @ApiProperty({ type: Number, example: 100, description: 'Specifies the minimum value allowed to grant a credit.' })
  minCreditValue: number

  @Prop({ type: Number, default: 5000 })
  @ApiProperty({ type: Number, example: 10000, description: 'Defines the maximum value allowed for a credit.' })
  maxCreditValue: number

  @Prop({ type: Number, default: 1 })
  @ApiProperty({ type: Number, example: 1, description: 'Sets the minimum percentage applicable in a transaction or financial calculation.' })
  minPercentage: number

  @Prop({ type: Number, default: 50 })
  @ApiProperty({ type: Number, example: 10, description: 'Defines the maximum percentage allowed in a transaction or financial calculation.' })
  maxPercentage: number

  // NOTIFICATIONS 

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Enables sending text messages (SMS) to the customer with relevant information.' })
  sendSmsToCustomer: boolean;
  
  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Enables sending email notifications to the customer.' })
  sendEmailNotificationsToCustomer: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Sends payment reminders to the customer via notifications.' })
  sendPaymentReminderNotification: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Sends email notifications when payments or installments are received.' })
  sendPaymentInstallmentNotification: boolean;

  @Prop({ type: String, default: 'app', enum: [ 'sms', 'email', 'app', 'whatsapp' ] })
  @ApiProperty({ type: String, example: 'sms', description: 'Preferred notification channel for the customer.' })
  preferredNotificationChannel: string;

  @Prop({ type: String, default: '8:00' })
  @ApiProperty({ type: String, example: '9:00', description: 'Start time range when notifications are sent to the customer (24 hours format).' })
  notificationSendTimeStart: string;

  @Prop({ type: String, default: '18:00' })
  @ApiProperty({ type: String, example: '17:00', description: 'End time range when notifications are sent to the customer (24 hours format).' })
  notificationSendTimeEnd: string;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Sends notifications when a credit is about to expire.' })
  sendCreditExpirationNotification: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Sends notifications when the status of a credit request changes.' })
  sendRequestStatusNotification: boolean;

  @Prop({ type: Boolean, default: true })
  @ApiProperty({ type: Boolean, example: true, description: 'Allows the customer to unsubscribe from certain types of notifications.' })
  allowUnsubscribeFromNotifications: boolean;

  // END 

  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Deletion date.' })
  @Prop({ type: String, default: null, nullable: true })
  deletedAt?: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Creation date.' })
  @Prop({ type: String, required: true })
  createdAt?: string;
  
  @ApiProperty({ example: '01/01/1900 00:00:00', description: 'Updated date.' })
  @Prop({ type: String, required: true })
  updatedAt?: string;

  @Prop({ type: Boolean, default: false })
  deleted: boolean;
}

export const ParameterSchema = SchemaFactory.createForClass(Parameter);
ParameterSchema.plugin(mongoosePaginate);
