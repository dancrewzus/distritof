import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min
} from 'class-validator';

export enum MethodsEnum {
  SMS = 'sms',
  EMAIL = 'email',
  APP = 'app',
  WHATSAPP = 'whatsapp',
}

export class CreateParameterDto {

  @ApiProperty({ example: 3, description: 'Days to cancel automatic requests.', type: Number })
  @IsNumber()
  @Min(1)
  daysToCancelAutomaticRequests: number;

  @ApiProperty({ example: 3, description: 'Days to generate automatic requests.', type: Number })
  @IsNumber()
  @Min(1)
  daysToGenerateAutomaticRequests: number;

  @ApiProperty({ example: false, description: 'Indicates whether quota settings are handled manually.', type: Boolean })
  @IsBoolean()
  isManualValues: boolean;

  @ApiProperty({ example: 2, description: 'Minimum daily installments to show as yellow.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsYellowDaily: number;

  @ApiProperty({ example: 1, description: 'Minimum weekly installments to show as yellow.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsYellowWeekly: number;

  @ApiProperty({ example: 2, description: 'Minimum biweekly installments to show as yellow.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsYellowBiweekly: number;

  @ApiProperty({ example: 2, description: 'Minimum monthly installments to show as yellow.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsYellowMonthly: number;

  @ApiProperty({ example: 4, description: 'Minimum daily installments to show as red.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsRedDaily: number;

  @ApiProperty({ example: 2, description: 'Minimum weekly installments to show as red.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsRedWeekly: number;

  @ApiProperty({ example: 4, description: 'Minimum biweekly installments to show as red.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsRedBiweekly: number;

  @ApiProperty({ example: 4, description: 'Minimum monthly installments to show as red.', type: Number })
  @IsNumber()
  @Min(1)
  minimumInstallmentsRedMonthly: number;

  @ApiProperty({ example: true, description: 'Indicates if mobile client creation is allowed.', type: Boolean })
  @IsBoolean()
  allowsMobileClientCreation: boolean;

  @ApiProperty({ example: false, description: 'Indicates if simultaneous credits are allowed for a client.', type: Boolean })
  @IsBoolean()
  allowsSimultaneousCreditsForClient: boolean;

  @ApiProperty({ example: 0, description: 'Interest rate for late payments.', type: Number })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRateForLatePayment: number;

  @ApiProperty({ example: false, description: 'Indicates if the next payment date should be scheduled for mobile.', type: Boolean })
  @IsBoolean()
  scheduleNextMobilePaymentDate: boolean;

  @ApiProperty({ example: false, description: 'Indicates if client quota validation is required.', type: Boolean })
  @IsBoolean()
  validateClientQuota: boolean;

  @ApiProperty({ example: 30, description: 'Default maximum debt days for a client.', type: Number })
  @IsNumber()
  @Min(1)
  defaultMaxClientDebtDays: number;

  @ApiProperty({ example: '07:00:00', description: 'Journal start hour (24h format HH:mm:ss).', type: String })
  @IsString()
  journalStart: string;

  @ApiProperty({ example: '21:00:00', description: 'Journal end hour (24h format HH:mm:ss).', type: String })
  @IsString()
  journalEnd: string;

  // Options General
  @ApiProperty({ example: false, description: 'Indicates whether the system can handle numeric values without the thousands separator.', type: Boolean })
  @IsBoolean()
  handleValuesWithoutThousands: boolean;

  @ApiProperty({ example: false, description: "Allows editing the customer's phone number once registered.", type: Boolean })
  @IsBoolean()
  allowEditCustomerPhone: boolean;

  @ApiProperty({ example: false, description: "Verifies the validity of the customer's ID document when creating or updating their profile.", type: Boolean })
  @IsBoolean()
  validateCustomerDocument: boolean;

  @ApiProperty({ example: false, description: 'Allows creating the same customer in multiple routes or locations.', type: Boolean })
  @IsBoolean()
  allowCreateCustomerOnMultipleRoutes: boolean;

  @ApiProperty({ example: false, description: 'Enables the option to list responsible parties (causers) in the mobile application.', type: Boolean })
  @IsBoolean()
  listCausersOnMobile: boolean;

  @ApiProperty({ example: false, description: 'Indicates whether the system can handle co-signers on a credit application.', type: Boolean })
  @IsBoolean()
  handleCoSigners: boolean;

  @ApiProperty({ example: false, description: 'Indicates whether the system should validate the GPS location in the mobile application.', type: Boolean })
  @IsBoolean()
  validateGpsOnMobile: boolean;

  @ApiProperty({ example: 6, description: 'Defines the maximum number of days allowed to cancel a transaction or request.', type: Number })
  @IsNumber()
  @Min(1)
  maxDaysForCancellation: number;

  // Credits
  @ApiProperty({ example: false, description: 'Allows creating credits without the need for a formal prior request.', type: Boolean })
  @IsBoolean()
  allowCreateCreditWithoutRequest: boolean; 

  @ApiProperty({ example: false, description: 'Indicates whether the system handles verification codes in the request process.', type: Boolean })
  @IsBoolean()
  handleVerificationCodeInRequest: boolean; 

  @ApiProperty({ example: false, description: 'Verifies the validity of credits granted directly without intermediaries.', type: Boolean })
  @IsBoolean()
  verifyDirectCredits: boolean; 

  @ApiProperty({ example: false, description: 'Indicates if late fees will be applied in the next billing cycle.', type: Boolean })
  @IsBoolean()
  chargeLateFeeOnNextCycle: boolean; 

  @ApiProperty({ example: false, description: 'Allows applying additional charges on certain transactions.', type: Boolean })
  @IsBoolean()
  applyAdditionalCharge: boolean;
  
  @ApiProperty({ example: 10, description: 'Defines the monetary value assigned to each visit made.', type: Number })
  @IsNumber()
  @Min(0)
  valuePerVisit: number;
  
  @ApiProperty({ example: 10, description: 'Specifies the minimum value allowed to grant a credit.', type: Number })
  @IsNumber()
  @Min(1)
  minCreditValue: number;
  
  @ApiProperty({ example: 10, description: 'Defines the maximum value allowed for a credit.', type: Number })
  @IsNumber()
  @Min(1)
  maxCreditValue: number;
  
  @ApiProperty({ example: 10, description: 'Sets the minimum percentage applicable in a transaction or financial calculation.', type: Number })
  @IsNumber()
  @Min(1)
  minPercentage: number;
  
  @ApiProperty({ example: 10, description: 'Defines the maximum percentage allowed in a transaction or financial calculation.', type: Number })
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxPercentage: number;

  // Notifications
  @ApiProperty({ example: false, description: 'Enables sending text messages (SMS) to the customer with relevant information.', type: Boolean })
  @IsBoolean()
  sendSmsToCustomer: boolean;

  @ApiProperty({ example: false, description: 'Enables sending email notifications to the customer.', type: Boolean })
  @IsBoolean()
  sendEmailNotificationsToCustomer: boolean;

  @ApiProperty({ example: false, description: 'Sends payment reminders to the customer via notifications.', type: Boolean })
  @IsBoolean()
  sendPaymentReminderNotification: boolean;

  @ApiProperty({ example: false, description: 'Sends email notifications when payments or installments are received.', type: Boolean })
  @IsBoolean()
  sendPaymentInstallmentNotification: boolean;

  @ApiProperty({ example: 'sms', description: 'Preferred notification channel for the customer.', type: String })
  @IsEnum(MethodsEnum)
  preferredNotificationChannel: string;

  @ApiProperty({ example: '8:00', description: 'Start time range when notifications are sent to the customer (24 hours format).', type: String })
  @IsString()
  notificationSendTimeStart: string;

  @ApiProperty({ example: '18:00', description: 'End time range when notifications are sent to the customer (24 hours format).', type: String })
  @IsString()
  notificationSendTimeEnd: string;

  @ApiProperty({ example: false, description: 'Sends notifications when a credit is about to expire.', type: Boolean })
  @IsBoolean()
  sendCreditExpirationNotification: boolean;

  @ApiProperty({ example: false, description: 'Sends notifications when the status of a credit request changes.', type: Boolean })
  @IsBoolean()
  sendRequestStatusNotification: boolean;

  @ApiProperty({ example: false, description: 'Allows the customer to unsubscribe from certain types of notifications.', type: Boolean })
  @IsBoolean()
  allowUnsubscribeFromNotifications: boolean;
}
