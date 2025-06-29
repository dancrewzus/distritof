import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { CreateIdentifierDto, UpdateIdentifierDto } from './dto'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { error } from 'src/common/constants/error-messages'
import { Identifier } from './entities/identifier.entity'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class IdentifiersService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Identifier.name, 'default') private readonly identifierModel: PaginateModel<Identifier>,
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
  
  private buildOptions(offset: number, limit: number): PaginateOptions {
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
    
    return options;
  }

  /**
   * Finds an identifier by its ID. This method searches for the identifier in the database using its ID.
   * If the identifier is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findIdentifier
   * @param {string} id - The ID of the identifier to find.
   * @returns {Promise<Identifier>} A promise that resolves to the identifier object if found.
   * @throws {NotFoundException} Throws this exception if the identifier with the specified ID is not found.
   */
  private findIdentifier = async (id: string): Promise<Identifier> => {
    try {
      const identifier = await this.identifierModel.findById(id)

      if(!identifier) {
        throw new NotFoundException(`Identifier with ID "${ id }" not found`)
      }
      return identifier
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an identifier. This method structures the identifier data to be returned,
   * including the ID, code, name, and format. It only returns the data if the identifier is active.
   *
   * @private
   * @function formatReturnData
   * @param {Identifier} identifier - The identifier object to format.
   * @returns {object} An object containing the formatted identifier data, or undefined if the identifier is not active.
   */
  private formatReturnData = (identifier: Identifier): object => {
    return {
      id: identifier.id,
      isActive: identifier?.isActive || false,
      code: identifier.code || '',
      name: identifier.name || '',
      format: identifier.format || '',
    }
  }
  
  /**
   * Creates a new identifier. This method takes a DTO for creating an identifier, the user requesting the
   * creation, and the client's IP address. It saves the new identifier in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateIdentifierDto} createIdentifierDto - Data Transfer Object containing details for the new identifier.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created identifier.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createIdentifierDto: CreateIdentifierDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { code, name, format } = createIdentifierDto;
      const identifier = await this.identifierModel.create({
        code,
        name,
        format,
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Identifier ${ identifier.id } was created.`,
        module: 'Identifiers',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return this.formatReturnData(identifier)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple identifiers with pagination and optional filtering. This method retrieves identifiers
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of identifiers. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered identifiers.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};

    try {

      const query = this.buildQuery(filter, isAdmin);
      const options = this.buildOptions(offset, limit);

      const identifiersResponse = await this.identifierModel.paginate(query, options)
      return {
        data: {
          pagination: identifiersResponse?.pagination || {},
          identifiers: identifiersResponse?.docs.map((identifier) => this.formatReturnData(identifier)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple identifiers with pagination and optional filtering. This method retrieves identifiers
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of identifiers. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findForRegister
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered identifiers.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findForRegister = async () => {
    try {
      const identifiersResponse = await this.identifierModel.find({
        isActive: true,
        deleted: false,
      })
      const forFilter = ['SYSTEM', 'NIN']
      const identifiers = identifiersResponse
        ?.filter(identifier => !forFilter.includes(identifier.code))
        .map((identifier) => this.formatReturnData(identifier))
        
      return {
        data: {
          identifiers,
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single identifier by its ID. This method uses the findIdentifier method to retrieve the identifier
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the identifier to find.
   * @returns {Promise<object>} A promise that resolves to the formatted identifier data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const identifier = await this.findIdentifier(id)
      return this.formatReturnData(identifier)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing identifier. This method finds the identifier by its ID, updates it with the provided
   * data, logs the update event, and returns the updated identifier data. If the identifier is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the identifier to update.
   * @param {UpdateIdentifierDto} updateIdentifierDto - Data Transfer Object containing the updated details for the identifier.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated identifier data.
   * @throws {NotFoundException} Throws this exception if the identifier with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateIdentifierDto: UpdateIdentifierDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const identifier = await this.identifierModel.findById(id)
      if(!identifier) {
        throw new NotFoundException(error.IDENTIFIER_NOT_FOUND)
      }
      await identifier.updateOne({
        ...updateIdentifierDto,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Identifier ${ identifier.id } was updated: ${ JSON.stringify(updateIdentifierDto) }.`,
        module: 'Identifiers',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...identifier.toJSON(), ...updateIdentifierDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an identifier by its ID. This method updates the identifier's status to inactive, logs the
   * deactivation event, and does not return any data. If the identifier is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the identifier to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the identifier with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const identifier = await this.identifierModel.findById(id)
      if(!identifier) {
        throw new NotFoundException(error.IDENTIFIER_NOT_FOUND)
      }
      await identifier.updateOne({ 
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Identifier ${ identifier.id } was deactivated.`,
        module: 'Identifiers',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
