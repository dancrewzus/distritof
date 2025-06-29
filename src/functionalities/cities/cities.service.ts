import { Injectable, NotFoundException, NotAcceptableException, ConflictException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { Country } from '../countries/entities/country.entity'
import { error } from 'src/common/constants/error-messages'
import { Track } from '../tracks/entities/track.entity'
import { CreateCityDto, UpdateCityDto } from './dto'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'
import { City } from './entities/city.entity'

@Injectable()
export class CitiesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Country.name, 'default') private readonly countryModel: Model<Country>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(City.name, 'default') private readonly cityModel: PaginateModel<City>,
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
          { name: new RegExp(filter, 'i') },
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
      populate: [
        {
          path: 'company country routes'
        }
      ]
    };
    return options;
  }

  /**
   * Finds an city by its ID. This method searches for the city in the database using its ID.
   * If the city is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findCity
   * @param {string} id - The ID of the city to find.
   * @returns {Promise<City>} A promise that resolves to the city object if found.
   * @throws {NotFoundException} Throws this exception if the city with the specified ID is not found.
   */
  private findCity = async (id: string): Promise<City> => {
    try {
      const city = await this.cityModel.findById(id)

      if(!city) {
        throw new NotFoundException(`City with ID "${ id }" not found`)
      }
      return city
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an city. This method structures the city data to be returned,
   * including the ID, code, name, and format. It only returns the data if the city is active.
   *
   * @private
   * @function formatReturnData
   * @param {City} city - The city object to format.
   * @returns {object} An object containing the formatted city data, or undefined if the city is not active.
   */
  private formatReturnData = (city: City): object => {
    return {
      id: city?.id,
      isActive: city?.isActive || false,
      name: city?.name || '',
      country: city?.country || {},
      company: city?.company || {},
      routes: city?.routes?.length || 0,
    }
  }
  
  /**
   * Creates a new city. This method takes a DTO for creating an city, the user requesting the
   * creation, and the client's IP address. It saves the new city in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateCityDto} createCityDto - Data Transfer Object containing details for the new city.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created city.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createCityDto: CreateCityDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { company, name, country } = createCityDto;
      
      const companyResponse = await this.companyModel.findById(company).populate('cities')
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      const countryResponse = await this.countryModel.findById(country)
      if(!countryResponse) {
        throw new NotFoundException(error.COUNTRY_NOT_FOUND)
      }

      const cityExist = await this.cityModel.findOne({ name, company: companyResponse._id })
      if(cityExist) {
        if(cityExist.isActive === false || cityExist.deleted === true) {
          await cityExist.updateOne({
            isActive: true,
            deleted: false,
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            deletedAt: null,
          });
  
          companyResponse.cities.push(cityExist.id)
          await companyResponse.save()
  
          await this.trackModel.create({
            ip: clientIp,
            description: `City ${ cityExist.name } (${ companyResponse.name }) was reactivated.`,
            module: 'Cities',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        } else {
          throw new ConflictException(error.CITY_ALREADY_EXIST)
        }
      } else {
        const createdCity = await this.cityModel.create({
          name,
          company: companyResponse._id,
          country: countryResponse._id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        });

        companyResponse.cities.push(createdCity.id)
        await companyResponse.save()

        await this.trackModel.create({
          ip: clientIp,
          description: `City ${ createdCity.name } (${ companyResponse.name }) was created.`,
          module: 'Cities',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      }
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple cities with pagination and optional filtering. This method retrieves cities
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of cities. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered cities.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, companyId, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const citiesResponse = await this.cityModel.paginate(query, options);
      
      return {
        data: {
          pagination: citiesResponse?.pagination || {},
          cities: citiesResponse?.docs.map((city) => this.formatReturnData(city)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds multiple cities with pagination and optional filtering. This method retrieves cities
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of cities. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findForRegister
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered cities.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findForRegister = async (companyId: string) => {
    try {

      const companyResponse = await this.companyModel.findById(companyId)
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const citiesResponse = await this.cityModel.find({ 
        isActive: true,
        deleted: false,
        company: companyResponse._id,
      }).sort({ name: 1 })
      return {
        data: {
          cities: citiesResponse?.map((city) => this.formatReturnData(city))
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single city by its ID. This method uses the findCity method to retrieve the city
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the city to find.
   * @returns {Promise<object>} A promise that resolves to the formatted city data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const city = await this.findCity(id)
      return this.formatReturnData(city)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing city. This method finds the city by its ID, updates it with the provided
   * data, logs the update event, and returns the updated city data. If the city is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the city to update.
   * @param {UpdateCityDto} updateCityDto - Data Transfer Object containing the updated details for the city.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated city data.
   * @throws {NotFoundException} Throws this exception if the city with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (cityId: string, updateCityDto: UpdateCityDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const cityResponse = await this.cityModel.findById(cityId).populate('company')
      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      await cityResponse.updateOne({
        ...updateCityDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      await this.trackModel.create({
        ip: clientIp,
        description: `City ${ cityResponse.name } (${ cityResponse.company?.name }) was updated: ${ JSON.stringify(updateCityDto) }.`,
        module: 'Cities',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an city by its ID. This method updates the city's status to inactive, logs the
   * deactivation event, and does not return any data. If the city is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the city to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the city with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (cityId: string, userRequest: User, clientIp: string) => {
    try {
      const cityResponse = await this.cityModel.findById(cityId)
        .populate('company')
        .populate('routes')

      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }
      
      const cityRoutes = cityResponse.routes?.filter(route => route.isActive && !route.deleted) || []
      if(cityRoutes.length > 0) {
        throw new NotAcceptableException(error.CITY_CANT_BE_DELETED)
      }

      await cityResponse.updateOne({
        isActive: false,
        deleted: true,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: this.dayjsAdapter.getCurrentDateTime()
      });

      const company = cityResponse.company
      await this.companyModel.updateOne(
        { _id: company._id },
        { $pull: { cities: cityResponse._id } }
      );

      await this.trackModel.create({
        ip: clientIp,
        description: `City ${ cityResponse.id } (${ cityResponse.company?.name }) was deactivated.`,
        module: 'Cities',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
