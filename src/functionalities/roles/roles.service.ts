import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { PaginateModel, Model, PaginateOptions } from 'mongoose'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { error } from 'src/common/constants/error-messages'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { CreateRoleDto, UpdateRoleDto } from './dto'
import { Utils } from 'src/common/utils/utils'
import { Role } from './entities/role.entity'

@Injectable()
export class RolesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Role.name, 'default') private readonly roleModel: PaginateModel<Role>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjs: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  /**
   * Finds an role by its ID. This method searches for the role in the database using its ID.
   * If the role is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findRole
   * @param {string} id - The ID of the role to find.
   * @returns {Promise<Role>} A promise that resolves to the role object if found.
   * @throws {NotFoundException} Throws this exception if the role with the specified ID is not found.
   */
  private findRole = async (id: string): Promise<Role> => {
    try {
      const license = await this.roleModel.findById(id)

      if(!license) {
        throw new NotFoundException(`Role with ID "${ id }" not found`)
      }
      return license
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an role. This method structures the role data to be returned,
   * including the ID, code, name, and format. It only returns the data if the role is active.
   *
   * @private
   * @function formatReturnData
   * @param {Role} role - The role object to format.
   * @returns {object} An object containing the formatted role data, or undefined if the role is not active.
   */
  private formatReturnData = (role: Role): object => {
    if(!role.isActive) return
    return {
      id: role.id,
      name: role.name || '',
    }
  }
  
  /**
   * Creates a new role. This method takes a DTO for creating an role, the user requesting the
   * creation, and the client's IP address. It saves the new role in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateRoleDto} createRoleDto - Data Transfer Object containing details for the new role.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created role.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createRoleDto: CreateRoleDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { name } = createRoleDto;

      const role = await this.roleModel.create({
        name: this.utils.capitalizeFirstLetter(name),
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Role ${ role.id } was created.`,
        module: 'Roles',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return this.formatReturnData(role)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple roles with pagination and optional filtering. This method retrieves roles
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of roles. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered roles.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any) => {
    const { limit, offset, filter } = paginationDto ? JSON.parse(paginationDto) : { limit: this.defaultLimit, offset: 0, filter: '' };
    const setOffset = offset === undefined ? 0 : offset
    const setLimit = limit === undefined ? this.defaultLimit : limit
    const isSearch = filter !== '' ? true : false
    try {
      const options: PaginateOptions = {
        offset: setOffset,
        limit: setLimit,
        populate: [ ],
        sort: { createdAt: 1 },
        customLabels: {
          meta: 'pagination'
        }
      };        
      let data: any = {
        isActive: true,
        deleted: false,
      }
      if(isSearch) {
        data = {
          $or: [
            { 
              name: new RegExp(filter, 'i'),
              isActive: true,
              deleted: false,
            },
          ]
        }
      }
      const rolesResponse = await this.roleModel.paginate(data, options)
      return {
        data: {
          pagination: rolesResponse?.pagination || {},
          roles: rolesResponse?.docs.map((license) => this.formatReturnData(license)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single role by its ID. This method uses the findRole method to retrieve the role
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the role to find.
   * @returns {Promise<object>} A promise that resolves to the formatted role data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const license = await this.findRole(id)
      return this.formatReturnData(license)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing role. This method finds the role by its ID, updates it with the provided
   * data, logs the update event, and returns the updated role data. If the role is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the role to update.
   * @param {UpdateRoleDto} updateRoleDto - Data Transfer Object containing the updated details for the role.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated role data.
   * @throws {NotFoundException} Throws this exception if the role with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateRoleDto: UpdateRoleDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const role = await this.roleModel.findById(id)
      if(!role) {
        throw new NotFoundException(error.ROLE_NOT_FOUND)
      }
      await role.updateOne({
        ...updateRoleDto,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Role ${ role.id } was updated: ${ JSON.stringify(updateRoleDto) }.`,
        module: 'Roles',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...role.toJSON(), ...updateRoleDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an role by its ID. This method updates the role's status to inactive, logs the
   * deactivation event, and does not return any data. If the role is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the role to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the role with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const role = await this.roleModel.findById(id)
      if(!role) {
        throw new NotFoundException(error.ROLE_NOT_FOUND)
      }
      await role.updateOne({ 
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Role ${ role.id } was deactivated.`,
        module: 'Roles',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
