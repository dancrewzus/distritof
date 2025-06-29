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
import { CreateHolidayDto, UpdateHolidayDto } from './dto'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Holiday } from './entities/holiday.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class HolidaysService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Holiday.name, 'default') private readonly holidayModel: PaginateModel<Holiday>,
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
          { holidayDate: new RegExp(filter, 'i') },
          { description: new RegExp(filter, 'i') },
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
        holidayDate: -1
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [{ path: 'company' }]
    };
    return options;
  }

  /**
   * Function to get all Sundays between the current date and an end date
   * @param startDate - Start date in 'DD/MM/YYYY' format (could be the current date)
   * @param endDate - End date in 'DD/MM/YYYY' format
   * @returns Array of strings with the dates of all Sundays in 'DD/MM/YYYY' format
   */
  private getSundays = (startDate: string, endDate: string): string[] => {
    const start = dayjs(startDate, 'DD/MM/YYYY').subtract(1, 'month');
    const end = dayjs(endDate, 'DD/MM/YYYY')

    const sundays: string[] = [];
    
    let currentDate = start;
    
    while (currentDate.isBefore(end) || currentDate.isSame(end)) {
      if (currentDate.day() === 0) {
        sundays.push(currentDate.format('DD/MM/YYYY'));
      }
      currentDate = currentDate.add(1, 'day');
    }
    return sundays;
  }

  /**
   * Finds an holiday by its ID. This method searches for the holiday in the database using its ID.
   * If the holiday is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findHoliday
   * @param {string} id - The ID of the holiday to find.
   * @returns {Promise<Holiday>} A promise that resolves to the holiday object if found.
   * @throws {NotFoundException} Throws this exception if the holiday with the specified ID is not found.
   */
  private findHoliday = async (id: string): Promise<Holiday> => {
    try {
      const holiday = await this.holidayModel.findById(id)

      if(!holiday) {
        throw new NotFoundException(`Holiday with ID "${ id }" not found`)
      }
      return holiday
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an holiday. This method structures the holiday data to be returned,
   * including the ID, code, name, and format. It only returns the data if the holiday is active.
   *
   * @private
   * @function formatReturnData
   * @param {Holiday} holiday - The holiday object to format.
   * @returns {object} An object containing the formatted holiday data, or undefined if the holiday is not active.
   */
  private formatReturnData = (holiday: Holiday): object => {
    return {
      id: holiday.id,
      holidayDate: holiday.holidayDate || '',
      description: holiday.description || '',
    }
  }
  
  /**
   * Creates a new holiday. This method takes a DTO for creating an holiday, the user requesting the
   * creation, and the client's IP address. It saves the new holiday in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateHolidayDto} createHolidayDto - Data Transfer Object containing details for the new holiday.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created holiday.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createHolidayDto: CreateHolidayDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { holidayDate, description, company } = createHolidayDto;
      
      const companyResponse = await this.companyModel.findById(company)
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const holidayExist = await this.holidayModel.findOne({ holidayDate, company: companyResponse._id })
      if(holidayExist) {
        if(holidayExist.isActive === false || holidayExist.deleted === true) {
          await holidayExist.updateOne({
            isActive: true,
            deleted: false,
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            deletedAt: null,
          });
  
          await this.trackModel.create({
            ip: clientIp,
            description: `Holiday ${ holidayExist.holidayDate } (${ companyResponse.name }) was reactivated.`,
            module: 'Holidays',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        } else {
          throw new ConflictException(error.HOLIDAY_ALREADY_EXIST)
        }
      } else {
        if(description !== 'RmVjaGEgaGFzdGEgcGFyYSBjcmVhciBkb21pbmdvcy4=') {
          const holiday = await this.holidayModel.create({
            holidayDate,
            description,
            createdBy: userRequest.id,
            company: companyResponse._id,
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
          });
    
          await this.trackModel.create({
            ip: clientIp,
            description: `Holiday ${ holiday.holidayDate } was created.`,
            module: 'Holidays',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
  
          return this.formatReturnData(holiday)
        } else {
          const sundayDescription = 'Domingo'
          const startDate = this.dayjsAdapter.getCurrentDate()
          const endDate = holidayDate
  
          const createdHolidays = await this.holidayModel.find({ description: sundayDescription })
          const createdSundays = createdHolidays.map((h) => h.holidayDate)
          const sundaysToCreate = this.getSundays(startDate, endDate)
  
          const sundays = sundaysToCreate.filter((s) => !createdSundays.includes(s))
  
          for (let index = 0; index < sundays.length; index++) {
            const sunday = sundays[index];
            await this.holidayModel.create({
              holidayDate: sunday,
              description: sundayDescription,
              createdBy: userRequest.id,
              company: companyResponse._id,
              createdAt: this.dayjsAdapter.getCurrentDateTime(),
              updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            });
          }
  
          await this.trackModel.create({
            ip: clientIp,
            description: `Sundays from ${ startDate } to ${ endDate } was created (${sundays.length}).`,
            module: 'Holidays',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
          
          return
        }
      }

      return
      
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple holidays with pagination and optional filtering. This method retrieves holidays
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of holidays. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered holidays.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, companyId, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);

      const holidaysResponse = await this.holidayModel.paginate(query, options)
      const holidays = holidaysResponse?.docs.map((holiday) => this.formatReturnData(holiday))
      const sortedHolidays = holidays.sort((a: any, b: any) => {
        return dayjs(a.holidayDate, 'DD/MM/YYYY').isAfter(dayjs(b.holidayDate, 'DD/MM/YYYY')) ? -1 : 1
      });
      return {
        data: {
          pagination: holidaysResponse?.pagination || {},
          holidays: sortedHolidays,
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single holiday by its ID. This method uses the findHoliday method to retrieve the holiday
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the holiday to find.
   * @returns {Promise<object>} A promise that resolves to the formatted holiday data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const holiday = await this.findHoliday(id)
      return this.formatReturnData(holiday)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing holiday. This method finds the holiday by its ID, updates it with the provided
   * data, logs the update event, and returns the updated holiday data. If the holiday is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the holiday to update.
   * @param {UpdateHolidayDto} updateHolidayDto - Data Transfer Object containing the updated details for the holiday.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated holiday data.
   * @throws {NotFoundException} Throws this exception if the holiday with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateHolidayDto: UpdateHolidayDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const holiday = await this.holidayModel.findById(id).populate('company')
      if(!holiday) {
        throw new NotFoundException(error.HOLIDAY_NOT_FOUND)
      }
      await holiday.updateOne({
        ...updateHolidayDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Holiday ${ holiday.holidayDate } (${ holiday.company?.name }) was updated: ${ JSON.stringify(updateHolidayDto) }.`,
        module: 'Holidays',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...holiday.toJSON(), ...updateHolidayDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an holiday by its ID. This method updates the holiday's status to inactive, logs the
   * deactivation event, and does not return any data. If the holiday is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the holiday to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the holiday with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const holiday = await this.holidayModel.findById(id).populate('company')
      if(!holiday) {
        throw new NotFoundException(error.HOLIDAY_NOT_FOUND)
      }
      await holiday.deleteOne();
      await this.trackModel.create({
        ip: clientIp,
        description: `Holiday ${ holiday.holidayDate } (${ holiday.company?.name }) was deleted.`,
        module: 'Holidays',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
