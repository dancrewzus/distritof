import { Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { CreateCountryDto, UpdateCountryDto } from './dto'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { error } from 'src/common/constants/error-messages'
import { Country } from './entities/country.entity'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class CountriesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Country.name, 'default') private readonly countryModel: PaginateModel<Country>,
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
      options.populate = [{ path: 'companies' }];
    }
    return options;
  }

  /**
   * Finds an country by its ID. This method searches for the country in the database using its ID.
   * If the country is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findCountry
   * @param {string} id - The ID of the country to find.
   * @returns {Promise<Country>} A promise that resolves to the country object if found.
   * @throws {NotFoundException} Throws this exception if the country with the specified ID is not found.
   */
  private findCountry = async (id: string): Promise<Country> => {
    try {
      const country = await this.countryModel.findById(id)

      if(!country) {
        throw new NotFoundException(`Country with ID "${ id }" not found`)
      }
      return country
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an country. This method structures the country data to be returned,
   * including the ID, code, name, and format. It only returns the data if the country is active.
   *
   * @private
   * @function formatReturnData
   * @param {Country} country - The country object to format.
   * @returns {object} An object containing the formatted country data, or undefined if the country is not active.
   */
  private formatReturnData = (country: Country): object => {
    return {
      id: country?.id,
      isActive: country?.isActive || false,
      code: country?.code || '',
      name: country?.name || '',
      phoneCode: country?.phoneCode || '',
      companies: country?.companies?.length || 0,
    }
  }
  
  /**
   * Creates a new country. This method takes a DTO for creating an country, the user requesting the
   * creation, and the client's IP address. It saves the new country in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateCountryDto} createCountryDto - Data Transfer Object containing details for the new country.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created country.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createCountryDto: CreateCountryDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { code, name, phoneCode } = createCountryDto;
      const country = await this.countryModel.create({
        code,
        name,
        phoneCode,
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Country ${ country.id } was created.`,
        module: 'Countries',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return this.formatReturnData(country)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple countries with pagination and optional filtering. This method retrieves countries
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of countries. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered countries.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const countriesResponse = await this.countryModel.paginate(query, options);
      
      return {
        data: {
          pagination: countriesResponse?.pagination || {},
          countries: countriesResponse?.docs.map((country) => this.formatReturnData(country)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds multiple countries with pagination and optional filtering. This method retrieves countries
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of countries. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findForRegister
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered countries.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findForRegister = async () => {
    try {
      const countriesResponse = await this.countryModel.find({ 
        isActive: true,
        deleted: false,
      }).sort({ phoneCode: 1 })
      return {
        data: {
          countries: countriesResponse?.map((country) => this.formatReturnData(country))
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single country by its ID. This method uses the findCountry method to retrieve the country
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the country to find.
   * @returns {Promise<object>} A promise that resolves to the formatted country data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const country = await this.findCountry(id)
      return this.formatReturnData(country)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing country. This method finds the country by its ID, updates it with the provided
   * data, logs the update event, and returns the updated country data. If the country is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the country to update.
   * @param {UpdateCountryDto} updateCountryDto - Data Transfer Object containing the updated details for the country.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated country data.
   * @throws {NotFoundException} Throws this exception if the country with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateCountryDto: UpdateCountryDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const country = await this.countryModel.findById(id)
      if(!country) {
        throw new NotFoundException(error.COUNTRY_NOT_FOUND)
      }
      await country.updateOne({
        ...updateCountryDto,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Country ${ country.id } was updated: ${ JSON.stringify(updateCountryDto) }.`,
        module: 'Countries',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...country.toJSON(), ...updateCountryDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an country by its ID. This method updates the country's status to inactive, logs the
   * deactivation event, and does not return any data. If the country is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the country to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the country with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const country = await this.countryModel.findById(id)
      if(!country) {
        throw new NotFoundException(error.COUNTRY_NOT_FOUND)
      }
      await country.updateOne({
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Country ${ country.id } was deactivated.`,
        module: 'Countries',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
