import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { CreateNeighborhoodDto, UpdateNeighborhoodDto } from './dto';
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { Neighborhood } from './entities/neighborhood.entity'
import { error } from 'src/common/constants/error-messages'
import { Track } from '../tracks/entities/track.entity'
import { City } from '../cities/entities/city.entity'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class NeighborhoodsService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Neighborhood.name, 'default') private readonly neighborhoodModel: PaginateModel<Neighborhood>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(City.name, 'default') private readonly cityModel: Model<City>,
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
          path: 'company city'
        }
      ]
    };
    return options;
  }

  /**
   * Finds a city by its ID. This method searches for the city in the database using its ID.
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
   * Formats the return data for a neighborhood. This method structures the neighborhood data to be returned,
   * including the ID, name, and associated city. It only returns the data if the neighborhood is active.
   *
   * @private
   * @function formatReturnData
   * @param {Neighborhood} neighborhood - The neighborhood object to format.
   * @returns {object} An object containing the formatted neighborhood data, or undefined if the neighborhood is not active.
   */
  private formatReturnData = (neighborhood: Neighborhood): object => {
    return {
      id: neighborhood?.id,
      isActive: neighborhood?.isActive || false,
      name: neighborhood?.name || '',
      city: neighborhood?.city || {},
      company: neighborhood?.company || {},
    }
  }
  
  /**
   * Creates a new neighborhood. This method takes a DTO for creating a neighborhood, the user requesting the
   * creation, and the client's IP address. It saves the new neighborhood in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateNeighborhoodDto} createNeighborhoodDto - Data Transfer Object containing details for the new neighborhood.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created neighborhood.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createNeighborhoodDto: CreateNeighborhoodDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { company, name, city } = createNeighborhoodDto;

      const companyResponse = await this.companyModel.findById(company)
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      const cityResponse = await this.cityModel.findById(city)
      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      const neighborhoodExist = await this.neighborhoodModel.findOne({ name, company: companyResponse._id })
      if(neighborhoodExist) {
        if(neighborhoodExist.isActive === false || neighborhoodExist.deleted === true) {
          await neighborhoodExist.updateOne({
            isActive: true,
            deleted: false,
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            deletedAt: null,
          });
  
          await this.trackModel.create({
            ip: clientIp,
            description: `Neighborhood ${ neighborhoodExist.name } (${ companyResponse.name }) was reactivated.`,
            module: 'Neighborhoods',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        } else {
          throw new ConflictException(error.NEIGHBORHOOD_ALREADY_EXIST)
        }
      } else {
        const createdNeighborhood = await this.neighborhoodModel.create({
          name,
          company: companyResponse._id,
          city: cityResponse._id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        });
  
        await this.trackModel.create({
          ip: clientIp,
          description: `Neighborhood ${ createdNeighborhood.name } (${ companyResponse.name }) was created.`,
          module: 'Neighborhoods',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      }


      // TODO cities & companies no tienen array de barrios! Debería tenerlos?
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple neighborhoods with pagination and optional filtering. This method retrieves neighborhoods
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of neighborhoods. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered neighborhoods.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, companyId, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const neighborhoodsResponse = await this.neighborhoodModel.paginate(query, options);
      
      return {
        data: {
          pagination: neighborhoodsResponse?.pagination || {},
          neighborhoods: neighborhoodsResponse?.docs.map((neighborhood) => this.formatReturnData(neighborhood)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds a single neighborhood by its ID. This method uses the findCity method to retrieve the neighborhood's city
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the neighborhood to find.
   * @returns {Promise<object>} A promise that resolves to the formatted neighborhood data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const neighborhood = await this.neighborhoodModel.findById(id).populate('city')
      if(!neighborhood) {
        throw new NotFoundException(error.NEIGHBORHOOD_NOT_FOUND)
      }
      return this.formatReturnData(neighborhood)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing neighborhood. This method finds the neighborhood by its ID, updates it with the provided
   * data, logs the update event, and returns the updated neighborhood data. If the neighborhood is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the neighborhood to update.
   * @param {UpdateNeighborhoodDto} updateNeighborhoodDto - Data Transfer Object containing the updated details for the neighborhood.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated neighborhood data.
   * @throws {NotFoundException} Throws this exception if the neighborhood with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateNeighborhoodDto: UpdateNeighborhoodDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const neighborhood = await this.neighborhoodModel.findById(id)
      if(!neighborhood) {
        throw new NotFoundException(error.NEIGHBORHOOD_NOT_FOUND)
      }

      await neighborhood.updateOne({
        ...updateNeighborhoodDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      await this.trackModel.create({
        ip: clientIp,
        description: `Neighborhood ${ neighborhood.id } was updated: ${ JSON.stringify(updateNeighborhoodDto) }.`,
        module: 'Neighborhoods',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates a neighborhood by its ID. This method updates the neighborhood's status to inactive, logs the
   * deactivation event, and does not return any data. If the neighborhood is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the neighborhood to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the neighborhood with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const neighborhoodResponse = await this.neighborhoodModel.findById(id).populate('company')
      if(!neighborhoodResponse) {
        throw new NotFoundException(error.NEIGHBORHOOD_NOT_FOUND)
      }

      await neighborhoodResponse.updateOne({
        isActive: false,
        deleted: true,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: this.dayjsAdapter.getCurrentDateTime()
      });

      await this.trackModel.create({
        ip: clientIp,
        description: `Neighborhood ${ neighborhoodResponse.id } (${ neighborhoodResponse.company?.name }) was deactivated.`,
        module: 'Neighborhoods',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })

      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
