import { Injectable, NotFoundException, NotAcceptableException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PaginateModel, PaginateOptions } from "mongoose";

import { StripeAdapter } from "src/common/adapters/stripe.adapter";
import { HandleErrors } from "src/common/utils/handleErrors.util";
import { CompaniesService } from "../companies/companies.service";
import { DayJSAdapter } from "src/common/adapters/dayjs.adapter";
import { Company } from "../companies/entities/company.entity";
import { License } from "../licenses/entities/license.entity";
import { error } from 'src/common/constants/error-messages'
import { Track } from "../tracks/entities/track.entity";
import { User } from "../users/entities/user.entity";
import { Payment } from "./entities/payment.entity";
import { CreateTDCPaymentDto, CreateTransferPaymentDto, PaymentDto, UpdateTransferPaymentDto } from "./dto";
import { ConfigService } from "@nestjs/config";
import { Utils } from "src/common/utils/utils";
import { ImagesService } from "../images/images.service";
import { ValidPaymentTypes } from "./interfaces/payment-types";
import { CompanyLicense } from "../companies/entities/company-license.entity";

@Injectable()
export class PaymentsService {
  private defaultLimit: number;

  constructor(
    @InjectModel(License.name, 'default') private readonly licenseModel: Model<License>,
    @InjectModel(Payment.name, 'default') private readonly paymentModel: PaginateModel<Payment>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(CompanyLicense.name, 'default') private readonly companyLicenseModel: Model<CompanyLicense>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly companyService: CompaniesService,
    private readonly handleErrors: HandleErrors,
    private readonly stripe: StripeAdapter,
    private readonly dayjs: DayJSAdapter,
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, isAdmin: boolean): any {
    const baseQuery = { deleted: false };
    // if (!isAdmin) {
    //   baseQuery['isActive'] = true;
    // }
  
    if (filter) {
      return {
        ...baseQuery,
        $or: [
          { status: new RegExp(filter, 'i') },
        ],
      };
    }
  
    return baseQuery;
  }
  
  private buildOptions(offset: number, limit: number, isAdmin: boolean): PaginateOptions {
    const options: PaginateOptions = {
      offset,
      limit,
      sort: { 
        createdAt: -1,
        isActive: -1,
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [
        {
          path: 'company license currency paymentPicture'
        },
        {
          path: 'company',
          populate: {
            path: 'country'
          }
        }
      ]
    };
    return options;
  }

  /**
   * Formats the return data for an payment. This method structures the payment data to be returned,
   * including the ID, code, name, and format. It only returns the data if the payment is active.
   *
   * @private
   * @function formatReturnData
   * @param {Payment} payment - The payment object to format.
   * @returns {object} An object containing the formatted payment data, or undefined if the payment is not active.
   */
  private formatReturnData = (payment: Payment): object => {
    return {
      id: payment?._id,
      paymentIntentId: payment?.paymentIntentId || null,
      bankWireReference: payment?.bankWireReference || null,
      amount: payment?.amount,
      exchangeRate: payment?.exchangeRate,
      paymentType: payment?.paymentType,
      status: payment?.status,
      description: payment?.description,
      isLicensePayment: payment?.isLicensePayment,
      paymentPicture: payment?.paymentPicture?.imageUrl || null,
      user: payment?.user,
      currency: payment?.currency,
      company: payment?.company,
      license: payment?.license,
      paymentDate: payment?.paymentDate,
    }
  }

  /**
   * Finds multiple payments with pagination and optional filtering. This method retrieves payments
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of payments. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered cities.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const paymentsResponse = await this.paymentModel.paginate(query, options);
      
      return {
        data: {
          pagination: paymentsResponse?.pagination || {},
          payments: paymentsResponse?.docs.map((payment) => this.formatReturnData(payment)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  private createPayments = async(paymentDto: PaymentDto, userRequest: User, clientIp: string): Promise<any> => {
    try {
      const [
        licenseResponse,
        companyResponse,
      ] = await Promise.all([
        this.licenseModel.findById(paymentDto.licenseId)
          .populate('currency'),
        this.companyModel.findById(paymentDto.companyId)
          .populate({
            path: 'licenses',
            populate: {
              path: 'payment',
              match: {
                status: { $ne: 'succeeded' },
              }
            },
            match: {
              isActive: true,
              isOutdated: false,
              licenseName: { $ne: 'Free' },
            }
          }),
      ])

      if(!licenseResponse) {
        throw new NotFoundException(error.LICENSE_NOT_FOUND)
      }
      if(licenseResponse.name.toUpperCase().includes("FREE")) {
        throw new NotAcceptableException(error.LICENSE_INVALID_FOR_PAYMENT)
      }
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const { licenses, name } = companyResponse

      if(paymentDto.isLicensePayment && licenses.length) {
        throw new NotAcceptableException(error.LICENSE_ACTIVE);
      }

      const transactionId = paymentDto.paymentType === ValidPaymentTypes.TRANSFER ? paymentDto.bankWireReference : paymentDto.paymentIntentId

      const [paymentResponse]: any = await Promise.all([
        this.paymentModel.create({
          paymentIntentId: paymentDto?.paymentIntentId || null,
          paymentType: paymentDto.paymentType,
          description: `[ ${paymentDto.paymentType} ] - ${paymentDto.isLicensePayment ? 'License' : 'Route' } Payment. Company ${ name }`,
          license: licenseResponse.id,
          company: companyResponse.id,
          currency: licenseResponse.currency,
          bankWireReference: paymentDto?.bankWireReference || null,
          user: userRequest.id,
          isLicensePayment: paymentDto.isLicensePayment,
          amount: licenseResponse.price,
          exchangeRate: 1, // TODO: Corregir al actualizar el modelo de datos de Pais/Moneda/Tasa de Cambio
          status: paymentDto.status,
          paymentPicture: paymentDto.createImageDto || null,
          paymentDate: this.dayjs.getCurrentDate(),
          createdAt: this.dayjs.getCurrentDateTime(),
          updatedAt: this.dayjs.getCurrentDateTime(),
        }),
        this.trackModel.create({
          ip: clientIp,
          description: `Payment ${paymentDto.paymentType} | reference: ${ transactionId } was created.`,
          module: 'Billing',
          createdAt: this.dayjs.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

      return this.formatReturnData(paymentResponse._doc);

    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public getSecret = async (
    licenseId: string,
    companyId: string,
    isLicensePayment: boolean,
    userRequest: User,
    clientIp: string
  ): Promise<any> => {
    try {
      const payment = await this.createPayments(
        {
          paymentIntentId: null,
          bankWireReference: null,
          licenseId,
          companyId,
          isLicensePayment,
          paymentType: ValidPaymentTypes.TDC,
          createImageDto: null,
          status: 'requires_confirmation'
        },
        userRequest,
        clientIp
      );
      const stripeResponse = await this.stripe.createPaymentIntent(payment.amount, payment.currency.code)
      const { id: paymentIntentId, client_secret: clientSecret, status } = stripeResponse
      
      const paymentUpdated = await this.paymentModel.findById(payment.id)
      paymentUpdated.paymentIntentId = paymentIntentId
      paymentUpdated.status = status
      paymentUpdated.save()

      return {
        data: {
          clientSecret
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  public createTDCPayments = async (
    createTDCPaymentDto: CreateTDCPaymentDto,
    userRequest: User,
    clientIp: string
  ): Promise<any> => {
    try {

      const { paymentIntentId } = createTDCPaymentDto

      const [
        stripeResponse,
        paymentResponse,
      ] = await Promise.all([
        this.stripe.getPaymentIntent(paymentIntentId),
        this.paymentModel.findOne({ paymentIntentId }).populate('company license'),
      ])
      
      if(!stripeResponse) {
        throw new NotFoundException(error.STRIPE_NOT_FOUND)
      }
      if(!paymentResponse) {
        throw new NotFoundException(error.PAYMENT_NOT_FOUND)
      }

      const { status: paymentStatus } = stripeResponse

      paymentResponse.status = paymentStatus
      paymentResponse.updatedAt = this.dayjs.getCurrentDateTime()

      await paymentResponse.save()

      const { company, license } = paymentResponse
      await this.companyService.assignLicense(
        {
          companyId: company.id,
          licenseId: license.id,
          paymentId: paymentResponse.id
        },
        userRequest,
        clientIp
      );

      return { 
        data: {
          paymentStatus 
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public createTransferPayments = async (
    createTransferPaymentDto: CreateTransferPaymentDto,
    userRequest: User,
    clientIp: string
  ): Promise<any> => {
    try {
      const { bankWireReference, licenseId, companyId, isLicensePayment, createImageDto } = createTransferPaymentDto

      let createdImage = null
      if(createImageDto) {
        createdImage = await this.imagesService.create(createImageDto, userRequest, clientIp);
      }

      const paymentResponse = await this.createPayments(
        {
          paymentIntentId: null,
          bankWireReference,
          licenseId,
          companyId,
          isLicensePayment,
          createImageDto: createdImage?.id || null,
          paymentType: ValidPaymentTypes.TRANSFER,
          status: 'requires_confirmation'
        },
        userRequest,
        clientIp
      );

      const { company, license } = paymentResponse
      await this.companyService.assignLicense(
        {
          companyId: company,
          licenseId: license,
          paymentId: paymentResponse.id
        },
        userRequest,
        clientIp
      );

      return { 
        data: {
          ...paymentResponse
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public updateStatusTransferPayments = async (id: string, updateTransferPaymentDto: UpdateTransferPaymentDto, userRequest: User, clientIp: string) => {
 
    try {
      const [
        paymentResponse,
        companyLicenseResponse,
      ] = await Promise.all([
        this.paymentModel.findById(id),
        this.companyLicenseModel.findOne({
          payment: id
        })
      ])

      if(!paymentResponse) {
        throw new NotFoundException(error.PAYMENT_NOT_FOUND)
      }

      if(paymentResponse.paymentType !== ValidPaymentTypes.TRANSFER) {
        throw new NotFoundException(error.PAYMENT_UPDATE_NOT_ACCEPTABLE)
      }

      if(!companyLicenseResponse) {
        throw new NotFoundException(error.LICENSE_NOT_FOUND)
      }

      const { confirmPayment } = updateTransferPaymentDto;

      const [
        paymentUpdatedResponse,
        companyLicenseUpdatedResponse,
        trackResponse,
      ] = await Promise.all([
        paymentResponse.updateOne({
          status: confirmPayment ? "succeeded" : "canceled",
          updatedAt: this.dayjs.getCurrentDateTime(),
        }),
        companyLicenseResponse.updateOne({
          // isActive: confirmPayment,
          isOutdated: !confirmPayment
        }),
        this.trackModel.create({
          ip: clientIp,
          description: `Payment ${ id } was updated status: ${ JSON.stringify(confirmPayment ? "succeeded" : "canceled") }.`,
          module: 'Payments',
          createdAt: this.dayjs.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

      return {
        data: {
          payment: this.formatReturnData(paymentResponse)
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}