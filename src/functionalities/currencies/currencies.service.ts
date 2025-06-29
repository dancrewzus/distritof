import { Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { error } from 'src/common/constants/error-messages'
import { Currency } from './entities/currency.entity'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class CurrenciesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Currency.name, 'default') private readonly currencyModel: PaginateModel<Currency>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjs: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, isAdmin: boolean): any {
    const baseQuery = { deleted: false };
    if (!isAdmin) {
      baseQuery['isActive'] = true;
    }
  
    if (filter) {
      return {
        ...baseQuery,
        $or: [
          { code: new RegExp(filter, 'i') },
          { name: new RegExp(filter, 'i') },
          { phoneCode: new RegExp(filter, 'i') },
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
        createdAt: 1,
        isActive: -1,
        name: 1
      },
      customLabels: {
        meta: 'pagination',
      },
    };
  
    if (isAdmin) {
      options.populate = [{ path: 'licenses' }];
    }
    return options;
  }

  /**
   * Finds an currency by its ID. This method searches for the currency in the database using its ID.
   * If the currency is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findCurrency
   * @param {string} id - The ID of the currency to find.
   * @returns {Promise<Currency>} A promise that resolves to the currency object if found.
   * @throws {NotFoundException} Throws this exception if the currency with the specified ID is not found.
   */
  private findCurrency = async (id: string): Promise<Currency> => {
    try {
      const currency = await this.currencyModel.findById(id)

      if(!currency) {
        throw new NotFoundException(`Currency with ID "${ id }" not found`)
      }
      return currency
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an currency. This method structures the currency data to be returned,
   * including the ID, code, name, and format. It only returns the data if the currency is active.
   *
   * @private
   * @function formatReturnData
   * @param {Currency} currency - The currency object to format.
   * @returns {object} An object containing the formatted currency data, or undefined if the currency is not active.
   */
  private formatReturnData = (currency: Currency): object => {
    return {
      id: currency.id,
      isActive: currency?.isActive || false,
      isPrimary: currency.isPrimary || false,
      code: currency.code || '',
      name: currency.name || '',
      decimals: currency.decimals || 0,
      licenses: currency?.licenses?.length || 0,
    }
  }
  
  /**
   * Creates a new currency. This method takes a DTO for creating an currency, the user requesting the
   * creation, and the client's IP address. It saves the new currency in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateCurrencyDto} createCurrencyDto - Data Transfer Object containing details for the new currency.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created currency.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createCurrencyDto: CreateCurrencyDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { code, name, decimals } = createCurrencyDto;
      const currency = await this.currencyModel.create({
        code,
        name,
        decimals,
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Currency ${ currency.id } was created.`,
        module: 'Currencies',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return this.formatReturnData(currency)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple currencies with pagination and optional filtering. This method retrieves currencies
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of currencies. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered currencies.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);

      const currenciesResponse = await this.currencyModel.paginate(query, options)

      return {
        data: {
          pagination: currenciesResponse?.pagination || {},
          currencies: currenciesResponse?.docs.map((currency) => this.formatReturnData(currency)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Finds multiple currencies with pagination and optional filtering. This method retrieves currencies
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of currencies. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findForRegister
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered currencies.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findForRegister = async () => {
    try {
      const currenciesResponse = await this.currencyModel.find({ 
        isActive: true,
        deleted: false,
      }).sort({ name: 1 })
      return {
        data: {
          currencies: currenciesResponse?.map((currency) => this.formatReturnData(currency))
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single currency by its ID. This method uses the findCurrency method to retrieve the currency
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the currency to find.
   * @returns {Promise<object>} A promise that resolves to the formatted currency data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const currency = await this.findCurrency(id)
      return this.formatReturnData(currency)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing currency. This method finds the currency by its ID, updates it with the provided
   * data, logs the update event, and returns the updated currency data. If the currency is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the currency to update.
   * @param {UpdateCurrencyDto} updateCurrencyDto - Data Transfer Object containing the updated details for the currency.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated currency data.
   * @throws {NotFoundException} Throws this exception if the currency with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateCurrencyDto: UpdateCurrencyDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const currency = await this.currencyModel.findById(id)
      if(!currency) {
        throw new NotFoundException(error.CURRENCY_NOT_FOUND)
      }
      const { isPrimary } = updateCurrencyDto
      if(isPrimary) {
        await this.currencyModel.updateMany(
          { isPrimary: true },
          { isPrimary: false }
        )
      }
      await currency.updateOne({
        ...updateCurrencyDto,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Currency ${ currency.id } was updated: ${ JSON.stringify(updateCurrencyDto) }.`,
        module: 'Currencies',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...currency.toJSON(), ...updateCurrencyDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an currency by its ID. This method updates the currency's status to inactive, logs the
   * deactivation event, and does not return any data. If the currency is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the currency to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the currency with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const currency = await this.currencyModel.findById(id)
      if(!currency) {
        throw new NotFoundException(error.CURRENCY_NOT_FOUND)
      }
      await currency.updateOne({ 
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Currency ${ currency.id } was deactivated.`,
        module: 'Currencies',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
