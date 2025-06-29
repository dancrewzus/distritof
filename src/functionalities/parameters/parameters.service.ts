import { Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel } from 'mongoose'
import { InjectModel } from '@nestjs/mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { error } from 'src/common/constants/error-messages'
import { Track } from '../tracks/entities/track.entity'
import { UpdateParameterDto } from './dto'
import { User } from '../users/entities/user.entity'
import { Parameter } from './entities/parameter.entity'

@Injectable()
export class ParametersService {

  constructor(
    @InjectModel(Parameter.name, 'default') private readonly parameterModel: PaginateModel<Parameter>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
  ) { }

  /**
   * Finds an parameter by its ID. This method searches for the parameter in the database using its ID.
   * If the parameter is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findParameter
   * @param {string} id - The ID of the parameter to find.
   * @returns {Promise<Parameter>} A promise that resolves to the parameter object if found.
   * @throws {NotFoundException} Throws this exception if the parameter with the specified ID is not found.
   */
  private findParameter = async (companyId: string, userRequest: User, clientIp: string): Promise<Parameter> => {
    try {
      let parameter = await this.parameterModel.findOne({ company: companyId })

      if(!parameter) {

        const companyResponse = await this.companyModel.findById(companyId)
        if(!companyResponse) {
          throw new NotFoundException(error.COMPANY_NOT_FOUND)
        }

        parameter = await this.parameterModel.create({
          company: companyId,
          daysToCancelAutomaticRequests: 6,
          daysToGenerateAutomaticRequests: 6,
          isManualValues: false,
          minimumInstallmentsYellowDaily: 2,
          minimumInstallmentsYellowWeekly: 2,
          minimumInstallmentsYellowBiweekly: 1,
          minimumInstallmentsYellowMonthly: 1,
          minimumInstallmentsRedDaily: 4,
          minimumInstallmentsRedWeekly: 3,
          minimumInstallmentsRedBiweekly: 2,
          minimumInstallmentsRedMonthly: 2,
          allowsMobileClientCreation: false,
          allowsSimultaneousCreditsForClient: false,
          interestRateForLatePayment: 5,
          scheduleNextMobilePaymentDate: true,
          validateClientQuota: true,
          defaultMaxClientDebtDays: 10,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        })

        await this.trackModel.create({
          ip: clientIp,
          module: 'Parameters',
          user: userRequest.id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          description: `Parameter for company ${ companyResponse.name } was created.`,
        })
      }
      return parameter
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an parameter. This method structures the parameter data to be returned,
   * including the ID, code, name, and format. It only returns the data if the parameter is active.
   *
   * @private
   * @function formatReturnData
   * @param {Parameter} parameter - The parameter object to format.
   * @returns {object} An object containing the formatted parameter data, or undefined if the parameter is not active.
   */
  private formatReturnData = (parameter: Parameter): object => {
    return {
      id: parameter?.id,
      daysToCancelAutomaticRequests: parameter?.daysToCancelAutomaticRequests || 0,
      daysToGenerateAutomaticRequests: parameter?.daysToGenerateAutomaticRequests || 0,
      isManualValues: parameter?.isManualValues,
      minimumInstallmentsYellowDaily: parameter?.minimumInstallmentsYellowDaily || 0,
      minimumInstallmentsYellowWeekly: parameter?.minimumInstallmentsYellowWeekly || 0,
      minimumInstallmentsYellowBiweekly: parameter?.minimumInstallmentsYellowBiweekly || 0,
      minimumInstallmentsYellowMonthly: parameter?.minimumInstallmentsYellowMonthly || 0,
      minimumInstallmentsRedDaily: parameter?.minimumInstallmentsRedDaily || 0,
      minimumInstallmentsRedWeekly: parameter?.minimumInstallmentsRedWeekly || 0,
      minimumInstallmentsRedBiweekly: parameter?.minimumInstallmentsRedBiweekly || 0,
      minimumInstallmentsRedMonthly: parameter?.minimumInstallmentsRedMonthly || 0,
      allowsMobileClientCreation: parameter?.allowsMobileClientCreation,
      allowsSimultaneousCreditsForClient: parameter?.allowsSimultaneousCreditsForClient,
      interestRateForLatePayment: parameter?.interestRateForLatePayment || 0,
      scheduleNextMobilePaymentDate: parameter?.scheduleNextMobilePaymentDate,
      validateClientQuota: parameter?.validateClientQuota,
      defaultMaxClientDebtDays: parameter?.defaultMaxClientDebtDays || 0,
      journalStart: parameter?.journalStart,
      journalEnd: parameter?.journalEnd,
      handleValuesWithoutThousands: parameter?.handleValuesWithoutThousands,
      allowEditCustomerPhone: parameter?.allowEditCustomerPhone,
      validateCustomerDocument: parameter?.validateCustomerDocument,
      allowCreateCustomerOnMultipleRoutes: parameter?.allowCreateCustomerOnMultipleRoutes,
      listCausersOnMobile: parameter?.listCausersOnMobile,
      handleCoSigners: parameter?.handleCoSigners,
      validateGpsOnMobile: parameter?.validateGpsOnMobile,
      maxDaysForCancellation: parameter?.maxDaysForCancellation,
      allowCreateCreditWithoutRequest: parameter?.allowCreateCreditWithoutRequest,
      handleVerificationCodeInRequest: parameter?.handleVerificationCodeInRequest,
      verifyDirectCredits: parameter?.verifyDirectCredits,
      chargeLateFeeOnNextCycle: parameter?.chargeLateFeeOnNextCycle,
      applyAdditionalCharge: parameter?.applyAdditionalCharge,
      valuePerVisit: parameter?.valuePerVisit,
      minCreditValue: parameter?.minCreditValue,
      maxCreditValue: parameter?.maxCreditValue,
      minPercentage: parameter?.minPercentage,
      maxPercentage: parameter?.maxPercentage,
      sendSmsToCustomer: parameter?.sendSmsToCustomer,
      sendEmailNotificationsToCustomer: parameter?.sendEmailNotificationsToCustomer,
      sendPaymentReminderNotification: parameter?.sendPaymentReminderNotification,
      sendPaymentInstallmentNotification: parameter?.sendPaymentInstallmentNotification,
      preferredNotificationChannel: parameter?.preferredNotificationChannel,
      notificationSendTimeStart: parameter?.notificationSendTimeStart,
      notificationSendTimeEnd: parameter?.notificationSendTimeEnd,
      sendCreditExpirationNotification: parameter?.sendCreditExpirationNotification,
      sendRequestStatusNotification: parameter?.sendRequestStatusNotification,
      allowUnsubscribeFromNotifications: parameter?.allowUnsubscribeFromNotifications,
    }
  }
  
  /**
   * Finds a single parameter by its ID. This method uses the findParameter method to retrieve the parameter
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the parameter to find.
   * @returns {Promise<object>} A promise that resolves to the formatted parameter data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (companyId: string, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const parameter = await this.findParameter(companyId, userRequest, clientIp)
      return this.formatReturnData(parameter)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing parameter. This method finds the parameter by its ID, updates it with the provided
   * data, logs the update event, and returns the updated parameter data. If the parameter is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the parameter to update.
   * @param {UpdateParameterDto} updateParameterDto - Data Transfer Object containing the updated details for the parameter.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated parameter data.
   * @throws {NotFoundException} Throws this exception if the parameter with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (parameterId: string, updateParameterDto: UpdateParameterDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const parameterResponse = await this.parameterModel.findById(parameterId).populate('company')
      if(!parameterResponse) {
        throw new NotFoundException(error.PARAMETER_NOT_FOUND)
      }

      await parameterResponse.updateOne({
        ...updateParameterDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      await this.trackModel.create({
        ip: clientIp,
        module: 'Parameters',
        user: userRequest.id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        description: `Parameter for company ${ parameterResponse.company?.name } was updated: ${ JSON.stringify(updateParameterDto) }.`,
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
