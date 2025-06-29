import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'

import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import * as isBetween from 'dayjs/plugin/isBetween'
import * as timezone from 'dayjs/plugin/timezone'
import * as utc from 'dayjs/plugin/utc'
import * as dayjs from 'dayjs'

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(timezone)
dayjs.extend(utc)

dayjs.tz.setDefault('America/Manaus')

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { error } from 'src/common/constants/error-messages'
import { CreateArrearDto, UpdateArrearDto } from './dto'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Arrear } from './entities/arrear.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class ArrearsService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Arrear.name, 'default') private readonly arrearModel: PaginateModel<Arrear>,
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
    const baseQuery = { deleted: false };
    if (!isAdmin) {
      baseQuery['isActive'] = true;
    }
    
    baseQuery['company'] = companyId;
    
    if (filter) {
      return {
        ...baseQuery,
        $or: [
          { arrearMonth: new RegExp(filter, 'i') },
          { arrearYear: new RegExp(filter, 'i') },
          { percent: new RegExp(filter, 'i') },
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
        arrearMonth: 1,
        arrearYear: 1,
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [{ path: 'company' }]
    };
    return options;
  }

  /**
   * Finds an arrear by its ID. This method searches for the arrear in the database using its ID.
   * If the arrear is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findArrear
   * @param {string} id - The ID of the arrear to find.
   * @returns {Promise<Arrear>} A promise that resolves to the arrear object if found.
   * @throws {NotFoundException} Throws this exception if the arrear with the specified ID is not found.
   */
  private findArrear = async (id: string): Promise<Arrear> => {
    try {
      const arrear = await this.arrearModel.findById(id)

      if(!arrear) {
        throw new NotFoundException(`Arrear with ID "${ id }" not found`)
      }
      return arrear
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an arrear. This method structures the arrear data to be returned,
   * including the ID, code, name, and format. It only returns the data if the arrear is active.
   *
   * @private
   * @function formatReturnData
   * @param {Arrear} arrear - The arrear object to format.
   * @returns {object} An object containing the formatted arrear data, or undefined if the arrear is not active.
   */
  private formatReturnData = (arrear: Arrear): object => {
    return {
      id: arrear.id,
      arrearYear: arrear.arrearYear || '',
      arrearMonth: arrear.arrearMonth || '',
      percent: arrear.percent || 0,
    }
  }
  
  /**
   * Creates a new arrear. This method takes a DTO for creating an arrear, the user requesting the
   * creation, and the client's IP address. It saves the new arrear in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateArrearDto} createArrearDto - Data Transfer Object containing details for the new arrear.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created arrear.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createArrearDto: CreateArrearDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { arrearYear, arrearMonth, percent, company } = createArrearDto;
      
      const companyResponse = await this.companyModel.findById(company)
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const arrearExist = await this.arrearModel.findOne({ arrearYear, arrearMonth, company: companyResponse._id })

      if(arrearExist) {
        if(arrearExist.isActive === false || arrearExist.deleted === true) {
          await arrearExist.updateOne({
            isActive: true,
            deleted: false,
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            deletedAt: null,
          });
  
          await this.trackModel.create({
            ip: clientIp,
            description: `Arrear ${ arrearExist.arrearMonth }/${ arrearExist.arrearYear } (${ companyResponse.name }) was reactivated.`,
            module: 'Arrears',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        } else {
          throw new ConflictException(error.ARREAR_ALREADY_EXIST)
        }
      } else {

        const arrear = await this.arrearModel.create({
          arrearYear,
          arrearMonth,
          percent,
          createdBy: userRequest.id,
          company: companyResponse._id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        });

        await this.trackModel.create({
          ip: clientIp,
          description: `Arrear ${ arrearMonth }/${ arrearYear } was created.`,
          module: 'Arrears',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })

        return this.formatReturnData(arrear)
      }
      
      return
      
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple arrears with pagination and optional filtering. This method retrieves arrears
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of arrears. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered arrears.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, companyId, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);

      const arrearsResponse = await this.arrearModel.paginate(query, options)
      return {
        data: {
          pagination: arrearsResponse?.pagination || {},
          arrears: arrearsResponse?.docs.map((el) => this.formatReturnData(el)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single arrear by its ID. This method uses the findArrear method to retrieve the arrear
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the arrear to find.
   * @returns {Promise<object>} A promise that resolves to the formatted arrear data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const arrear = await this.findArrear(id)
      return this.formatReturnData(arrear)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing arrear. This method finds the arrear by its ID, updates it with the provided
   * data, logs the update event, and returns the updated arrear data. If the arrear is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the arrear to update.
   * @param {UpdateArrearDto} updateArrearDto - Data Transfer Object containing the updated details for the arrear.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated arrear data.
   * @throws {NotFoundException} Throws this exception if the arrear with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateArrearDto: UpdateArrearDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const arrear = await this.arrearModel.findById(id)
      if(!arrear) {
        throw new NotFoundException(error.ARREAR_NOT_FOUND)
      }
      await arrear.updateOne({
        ...updateArrearDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Arrear ${ arrear.id } was updated: ${ JSON.stringify(updateArrearDto) }.`,
        module: 'Arrears',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...arrear.toJSON(), ...updateArrearDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an arrear by its ID. This method updates the arrear's status to inactive, logs the
   * deactivation event, and does not return any data. If the arrear is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the arrear to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the arrear with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const arrear = await this.arrearModel.findById(id)
      if(!arrear) {
        throw new NotFoundException(error.ARREAR_NOT_FOUND)
      }
      await arrear.updateOne({ 
        deleted: true,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: this.dayjsAdapter.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Arrear ${ arrear.id } was deactivated.`,
        module: 'Arrears',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
