import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { Currency } from '../currencies/entities/currency.entity'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { error } from 'src/common/constants/error-messages'
import { CreateLicenseDto, UpdateLicenseDto } from './dto'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { License } from './entities/license.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class LicensesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(License.name, 'default') private readonly licenseModel: PaginateModel<License>,
    @InjectModel(Currency.name, 'default') private readonly currencyModel: Model<Currency>,
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
        ],
      };
    }
  
    return baseQuery;
  }
  
  private buildOptions(offset: number, limit: number): PaginateOptions {
    const options: PaginateOptions = {
      offset,
      limit,
      sort: { 
        createdAt: 1,
        isActive: -1,
        name: 1
      },
      populate: [
        {
          path: 'currency'
        },
      ],
      customLabels: {
        meta: 'pagination',
      },
    };
    
    return options;
  }

  /**
   * Finds an license by its ID. This method searches for the license in the database using its ID.
   * If the license is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findLicense
   * @param {string} id - The ID of the license to find.
   * @returns {Promise<License>} A promise that resolves to the license object if found.
   * @throws {NotFoundException} Throws this exception if the license with the specified ID is not found.
   */
  private findLicense = async (id: string): Promise<License> => {
    try {
      const license = await this.licenseModel.findById(id)

      if(!license) {
        throw new NotFoundException(`License with ID "${ id }" not found`)
      }
      return license
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an license. This method structures the license data to be returned,
   * including the ID, code, name, and format. It only returns the data if the license is active.
   *
   * @private
   * @function formatReturnData
   * @param {License} license - The license object to format.
   * @returns {object} An object containing the formatted license data, or undefined if the license is not active.
   */
  private formatReturnData = (license: License): object => {
    return {
      id: license.id,
      isActive: license?.isActive || false,
      code: license.code || '',
      name: license.name || '',
      days: license.days || 0,
      price: license.price || 0,
      currency: license.currency || '',
    }
  }
  
  /**
   * Creates a new license. This method takes a DTO for creating an license, the user requesting the
   * creation, and the client's IP address. It saves the new license in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateLicenseDto} createLicenseDto - Data Transfer Object containing details for the new license.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created license.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createLicenseDto: CreateLicenseDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { code, name, days, price, currency } = createLicenseDto;

      const currencyExist = await this.currencyModel.findById(currency)
      if(!currencyExist) {
        throw new NotFoundException(error.CURRENCY_NOT_FOUND)
      }

      const license = await this.licenseModel.create({
        code,
        name,
        days,
        price,
        currency: currencyExist.id,
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `License ${ license.id } was created.`,
        module: 'Licenses',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return this.formatReturnData(license)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple licenses with pagination and optional filtering. This method retrieves licenses
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of licenses. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered licenses.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any, userRequest: User) => {
    try {
      const pagination = paginationDto && !this.utils.isEmptyObject(paginationDto) 
      ? JSON.parse(paginationDto) 
      : { limit: this.defaultLimit, offset: 0, filter: ''};

      const isAdmin = ['root', 'admin'].includes(userRequest?.role?.name);

      const query = this.buildQuery(pagination?.filter || '', isAdmin);
      const options = this.buildOptions(pagination?.offset || 0, pagination?.limit || 1000);

      const licensesResponse = await this.licenseModel.paginate(query, options)
      return {
        data: {
          pagination: licensesResponse?.pagination || {},
          licenses: licensesResponse?.docs.map((license) => this.formatReturnData(license)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single license by its ID. This method uses the findLicense method to retrieve the license
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the license to find.
   * @returns {Promise<object>} A promise that resolves to the formatted license data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const license = await this.findLicense(id)
      return this.formatReturnData(license)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing license. This method finds the license by its ID, updates it with the provided
   * data, logs the update event, and returns the updated license data. If the license is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the license to update.
   * @param {UpdateLicenseDto} updateLicenseDto - Data Transfer Object containing the updated details for the license.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated license data.
   * @throws {NotFoundException} Throws this exception if the license with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateLicenseDto: UpdateLicenseDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const license = await this.licenseModel.findById(id)
      if(!license) {
        throw new NotFoundException(error.LICENSE_NOT_FOUND)
      }
      await license.updateOne({
        ...updateLicenseDto,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `License ${ license.id } was updated: ${ JSON.stringify(updateLicenseDto) }.`,
        module: 'Licenses',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...license.toJSON(), ...updateLicenseDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an license by its ID. This method updates the license's status to inactive, logs the
   * deactivation event, and does not return any data. If the license is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the license to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the license with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const license = await this.licenseModel.findById(id).populate('companies')
      if(!license) {
        throw new NotFoundException(error.LICENSE_NOT_FOUND)
      }
      // TODO Validate if have companies
      await license.updateOne({ 
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `License ${ license.id } was deactivated.`,
        module: 'Licenses',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
