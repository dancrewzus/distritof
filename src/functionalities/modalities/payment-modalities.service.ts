import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { CreatePaymentModalityDto, UpdatePaymentModalityDto } from './dto'
import { PaymentModality } from './entities/payment-modality.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { error } from 'src/common/constants/error-messages'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class PaymentModalitiesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(PaymentModality.name, 'default') private readonly paymentModalityModel: PaginateModel<PaymentModality>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, companyId: string, isAdmin: boolean): any {
    
    const baseQuery = { deleted: false, isActive: true, company: companyId };

    if (filter) {
      const filterRegex = new RegExp(filter, 'i');
      const filterAsNumber = Number(filter);
      const isNumeric = !isNaN(filterAsNumber);

      const orConditions: any[] = [
        { title: filterRegex },
        { type: filterRegex },
      ];

      if (isNumeric) {
        orConditions.push(
          { days: filterAsNumber },
          { percent: filterAsNumber },
          { value: filterAsNumber },
          { weeks: filterAsNumber },
          { fortnights: filterAsNumber },
          { months: filterAsNumber },
        );
      }

      return {
        ...baseQuery,
        $or: orConditions,
      };
    }
  
    return baseQuery;
  }
  
  private buildOptions(offset: number, limit: number, isAdmin: boolean): PaginateOptions {
    const options: PaginateOptions = {
      offset,
      limit,
      sort: { 
        createdAt: 1,
        isActive: -1,
        name: 1
      },
      customLabels: {
        meta: 'pagination',
      },
    };
  
    if (isAdmin) {
      options.populate = [{ path: 'createdBy' }];
    }
    return options;
  }

  /**
   * Finds an payment modality by its ID. This method searches for the payment modality in the database using its ID.
   * If the payment modality is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findPaymentModality
   * @param {string} id - The ID of the payment modality to find.
   * @returns {Promise<PaymentModality>} A promise that resolves to the payment modality object if found.
   * @throws {NotFoundException} Throws this exception if the payment modality with the specified ID is not found.
   */
  private findPaymentModality = async (id: string): Promise<PaymentModality> => {
    try {
      const paymentModality = await this.paymentModalityModel.findById(id)

      if(!paymentModality) {
        throw new NotFoundException(`Payment Modality with ID "${ id }" not found`)
      }
      return paymentModality
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an payment modality. This method structures the payment modality data to be returned,
   * including the ID, code, name, and format. It only returns the data if the payment modality is active.
   *
   * @private
   * @function formatReturnData
   * @param {PaymentModality} paymentModality - The payment modality object to format.
   * @returns {object} An object containing the formatted payment modality data, or undefined if the payment modality is not active.
   */
  private formatReturnData = (paymentModality: PaymentModality): object => {
    return {
      id: paymentModality?.id,
      isActive: paymentModality?.isActive || false,
      createdBy: paymentModality?.createdBy?.email || '',
      title: paymentModality?.title || '',
      value: paymentModality?.value || 0,
      type: paymentModality?.type || '',
      percent: paymentModality?.percent || 0,
      days: paymentModality?.days || 0,
      weeks: paymentModality?.weeks || 0,
      fortnights: paymentModality?.fortnights || 0,
      months: paymentModality?.months || 0,
      offDays: paymentModality?.offDays || false,
    }
  }
  
  /**
   * Creates a new payment modality. This method takes a DTO for creating an payment modality, the user requesting the
   * creation, and the client's IP address. It saves the new payment modality in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreatePaymentModalityDto} createPaymentModalityDto - Data Transfer Object containing details for the new payment modality.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created payment modality.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createPaymentModalityDto: CreatePaymentModalityDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {

      const {
        company,
        title,
        ...restOfData
      } = createPaymentModalityDto

      const companyResponse = await this.companyModel.findById(createPaymentModalityDto.company)
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const modalityExist = await this.paymentModalityModel.findOne({ title, company: companyResponse._id })
      if(modalityExist) {
        if(modalityExist.isActive === false || modalityExist.deleted === true) {
          await modalityExist.updateOne({
            isActive: true,
            deleted: false,
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            deletedAt: null,
          });
  
          await this.trackModel.create({
            ip: clientIp,
            description: `Payment Modality ${ modalityExist.title } (${ companyResponse.name }) was reactivated.`,
            module: 'PaymentModality',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        } else {
          throw new ConflictException(error.PAYMENT_MODALITY_ALREADY_EXIST)
        }
      } else {

        const paymentModality = await this.paymentModalityModel.create({
          title,
          ...restOfData,
          isActive: true,
          createdBy: userRequest.id,
          company: companyResponse._id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        });
        await this.trackModel.create({
          ip: clientIp,
          description: `Payment Modality ${ paymentModality.title } was created.`,
          module: 'PaymentModality',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
        return this.formatReturnData(paymentModality)
      }
      return
    } catch (error) {
      // console.log("🚀 ~ PaymentModalitiesService ~ error:", error)
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple payment modalities with pagination and optional filtering. This method retrieves payment modalities
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of payment modalities. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered payment modalities.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, companyId, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const paymentModalitiesResponse = await this.paymentModalityModel.paginate(query, options);
      
      return {
        data: {
          pagination: paymentModalitiesResponse?.pagination || {},
          paymentModalities: paymentModalitiesResponse?.docs.map((paymentModality) => this.formatReturnData(paymentModality)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds multiple payment modalities with pagination and optional filtering. This method retrieves payment modalities
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of payment modalities. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findForRegister
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered payment modalities.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findForRegister = async () => {
    try {
      const paymentModalitiesResponse = await this.paymentModalityModel.find({ 
        isActive: true,
        deleted: false,
      }).sort({ name: 1 })
      return {
        data: {
          paymentModalities: paymentModalitiesResponse?.map((paymentModality) => this.formatReturnData(paymentModality))
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single payment modality by its ID. This method uses the findPaymentModality method to retrieve the payment modality
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the payment modality to find.
   * @returns {Promise<object>} A promise that resolves to the formatted payment modality data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const paymentModality = await this.findPaymentModality(id)
      return this.formatReturnData(paymentModality)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing payment modality. This method finds the payment modality by its ID, updates it with the provided
   * data, logs the update event, and returns the updated payment modality data. If the payment modality is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the payment modality to update.
   * @param {UpdatePaymentModalityDto} updatePaymentModalityDto - Data Transfer Object containing the updated details for the payment modality.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated payment modality data.
   * @throws {NotFoundException} Throws this exception if the payment modality with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updatePaymentModalityDto: UpdatePaymentModalityDto, userRequest: User, clientIp: string): Promise<object> => {
    // console.log("🚀 ~ PaymentModalitiesService ~ update= ~ updatePaymentModalityDto:", updatePaymentModalityDto)
    try {
      const paymentModalityResponse = await this.paymentModalityModel.findById(id).populate('company')
      if(!paymentModalityResponse) {
        throw new NotFoundException(error.PAYMENT_MODALITY_NOT_FOUND)
      }

      await paymentModalityResponse.updateOne({
        ...updatePaymentModalityDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      await this.trackModel.create({
        ip: clientIp,
        description: `Payment Modality ${ paymentModalityResponse.title } (${ paymentModalityResponse.company?.name }) was updated: ${ JSON.stringify(updatePaymentModalityDto) }.`,
        module: 'PaymentModality',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an payment modality by its ID. This method updates the payment modality's status to inactive, logs the
   * deactivation event, and does not return any data. If the payment modality is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the payment modality to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the payment modality with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      // TODO validar si está siendo usada en un contrato, si es así no se puede eliminar
      const paymentModality = await this.paymentModalityModel.findById(id)
      if(!paymentModality) {
        throw new NotFoundException(error.PAYMENT_MODALITY_NOT_FOUND)
      }

      await paymentModality.updateOne({
        deleted: true,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: this.dayjsAdapter.getCurrentDateTime()
      });

      await this.trackModel.create({
        ip: clientIp,
        description: `Payment Modality ${ paymentModality.title } (${ paymentModality.id }) was deactivated.`,
        module: 'PaymentModality',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
