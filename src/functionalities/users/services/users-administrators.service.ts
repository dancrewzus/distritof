import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions, isObjectIdOrHexString } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'

import { UserReturnData } from '../interfaces/user-return-data.interface'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../../companies/entities/company.entity'
import { MailAdapter } from 'src/common/adapters/mail.adapter'
import { error } from 'src/common/constants/error-messages'
import { Image } from '../../images/entities/image.entity'
import { Track } from '../../tracks/entities/track.entity'
import { UserData } from '../entities/userData.entity'
import { CreateUserDto, UpdateUserDto } from '../dto'
import { Role } from '../../roles/entities/role.entity'
import { Utils } from 'src/common/utils/utils'
import { User } from '../entities/user.entity'
import { UserUtils } from '../utils/user.utils'

@Injectable()
export class UsersAdministratorsService {

  private defaultLimit: number;

  constructor(
    @InjectModel(UserData.name, 'default') private readonly userDataModel: Model<UserData>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(User.name, 'default') private readonly userModel: PaginateModel<User>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(Image.name, 'default') private readonly imageModel: Model<Image>,
    @InjectModel(Role.name, 'default') private readonly roleModel: Model<Role>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly userUtils: UserUtils,
    private readonly dayjs: DayJSAdapter,
    private readonly mail: MailAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, databaseRole: any, companyId: string, isAdmin: boolean): any {
    const baseQuery = {
      role: databaseRole.id,
      deleted: false,
    };
    if (!isAdmin) {
      baseQuery['isActive'] = true;
      // baseQuery['deleted'] = true;
    }
    if(companyId) {
      baseQuery['companies'] = companyId;
    }
  
    if (filter) {
      return {
        ...baseQuery,
        $or: [
          { email: new RegExp(filter, 'i') },
          { identifier: new RegExp(filter, 'i') },
          { firstName: new RegExp(filter, 'i') },
          { paternalSurname: new RegExp(filter, 'i') },
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
        firstName: 1
      },
      populate: [
        { 
          path: 'role', select: 'name'
        },
        {
          path: 'createdBy country identifierType companies'
        },
        {
          path: 'userData',
          populate: {
            path: 'profilePicture addressPicture identifierPicture'
          }
        }
      ],
      customLabels: {
        meta: 'pagination',
      },
    };
    return options;
  }

  private checkIfUserExist = async ({ email }) => {
    const userExist = await this.userModel.findOne({ email }).populate('role').populate('userData')
    return {
      status: userExist ? true : false,
      user: userExist || null
    }
  }

  /**
   * Finds a user based on a search criteria (ID or email). This method determines the search type and retrieves
   * the user accordingly, populating the relevant fields. If no user is found, it throws a NotFoundException.
   *
   * @private
   * @async
   * @function findUser
   * @param {string} search - The search criteria, which can be a user ID or an email address.
   * @returns {Promise<User>} A promise that resolves to the user object if found.
   * @throws {NotFoundException} Throws this exception if the user with the specified search criteria is not found.
   */
  private findUser = async (search: string): Promise<User> => {
    try {
      let user: User;
      const searchTypeResponse = this.searchType(search)
      switch (searchTypeResponse) {
        case 'id':
          user = await this.userModel.findById(search)
                  .populate({ path: 'role', select: 'name' })
                  .populate('createdBy')
                  .populate({ 
                    path: 'userData',
                    populate: {
                      path: 'profilePicture'
                    }
                  })
          break;
        case 'email':
          user = await this.userModel.findOne({ email: search.toLocaleLowerCase() })
                  .populate({ path: 'role', select: 'name' })
                  .populate('createdBy')
                  .populate({ 
                    path: 'userData',
                    populate: {
                      path: 'profilePicture'
                    }
                  })
          break;
        default:
          user = null;
          break;
      }
      if(!user) {
        throw new NotFoundException(`User with ${ searchTypeResponse } "${ search }" not found`)
      }
      return user
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Determines the search type based on the input value. It checks whether the input is a valid MongoDB object ID
   * or a valid email address.
   *
   * @private
   * @function searchType
   * @param {string | number} search - The search input which can be an ID or an email address.
   * @returns {string} The determined search type ('id', 'email', or 'invalid').
   */
  private searchType = (search: string | number): string => {
    if(isObjectIdOrHexString(search)) {
      return 'id'
    }
    if(this.utils.validateEmail(`${ search }`)) {
      return 'email'
    }
    return 'invalid'
  }

  /**
   * Creates a new user with the provided details. This includes creating the user and associated user data in the
   * database, logging the creation event, and returning the formatted user data.
   *
   * @public
   * @async
   * @function create
   * @param {CreateUserDto} createUserDto - Data Transfer Object containing the user creation details.
   * @param {string} clientIp - The IP address of the client making the creation request.
   * @returns {Promise<UserReturnData>} A promise that resolves to an object containing the formatted user data.
   * @throws {NotFoundException} Throws this exception if the specified role or profile picture is not found.
   */
  public create = async (createUserDto: CreateUserDto, userRequest: User, clientIp: string): Promise<UserReturnData> => {
    try {
      const {
        role,
        email,
        country,
        company,
        password,
        identifier,
        identifierType,
        firstName,
        paternalSurname,
        identifierPicture,
        ...userDataDto
      } = createUserDto;

      // TODO crear un endpoint aparte sólo para crear a los clientes de la empresa (companyClient)
      const databaseRole = await this.roleModel.findOne({ name: role as string /* || 'companyClient' as string */ })
      if(!databaseRole) {
        throw new NotFoundException(`Role with id or name "${ role }" not found`)
      }

      const companyResponse = await this.companyModel.findById(company).populate('users')
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const userExist = await this.checkIfUserExist({ email })
      if(userExist?.status) {
        // const { user } = userExist
        // const { userData } = user
        
        // await user.deleteOne()
        // await userData.deleteOne()

        throw new ConflictException({
          status: HttpStatus.CONFLICT,
          message: 'User already exists',
          user: userExist?.user,
        })

      }
      
      // let databaseIdentifierPicture = null
      // if(identifierPicture !== '') {
      //   databaseIdentifierPicture = await this.imageModel.findById(addressPicture)
      //   if(!databaseIdentifierPicture) {
      //     throw new NotFoundException(`Identifier photo with id "${ addressPicture }" not found`)
      //   }
      // }

      const isAdmin = ['admin','root'].includes(databaseRole.name)
      
      const user = await this.userModel.create({
        country,
        identifier,
        identifierType,
        firstName: this.utils.capitalizeFirstLetter(firstName).trim(),
        paternalSurname: this.utils.capitalizeFirstLetter(paternalSurname).trim(),
        email: email.toLowerCase().trim(),
        password: bcrypt.hashSync(`${ password ? password : (databaseRole.name === 'admin' ? email : identifier) }`, 10),
        validationCode: this.utils.generateRandomCode(),
        role: databaseRole.id,
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
        isLogged: isAdmin
      });

      const {
        gender,
        billingAddress,
        residenceAddress,
        phoneNumber,
        identifierExpireDate,
        securityQuestion,
        securityAnswer,
      } = userDataDto

      const userData = await this.userDataModel.create({
        gender,
        billingAddress,
        residenceAddress,
        phoneNumber,
        identifierExpireDate,
        securityQuestion,
        securityAnswer,
        user: user.id,
        profilePicture: null,
        addressPicture: null,
        identifierPicture: null,
        createdAt: this.dayjs.getCurrentDateTime(),
        updatedAt: this.dayjs.getCurrentDateTime(),
      })

      user.userData = userData.id
      // user.companies.push(companyResponse)
      await user.save()
      
      // companyResponse.users.push(user)
      // await companyResponse.save()
      
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user.email } was created.`,
        module: 'Users',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })

      if(!isAdmin) {
        await this.mail.sendValidationCode(user)
      }
      // user.role = databaseRole
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Finds multiple users with pagination and optional filtering. This method retrieves users based on pagination
   * and filter criteria, structures the response to include pagination details and the filtered list of users.
   *
   * @public
   * @async
   * @function findUsers
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @param {string} role - The role of the users to be retrieved.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered users.
   * @throws {NotFoundException} Throws this exception if the specified role is not found.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findUsers = async (paginationDto: any = {}, role: string, companyId: string, userRequest: User) => {

    const databaseRole = await this.roleModel.findOne({ name: role as string })
    if(!databaseRole) {
      throw new NotFoundException(`Role with name ${ role } not found`)
    }

    const companyResponse = await this.companyModel.findById(companyId)
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
    
    const isAdmin = ['root', 'admin'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};

    try {
      const query = this.buildQuery(filter, databaseRole, companyId, isAdmin);
      const options = this.buildOptions(offset, limit);
      
      const usersResponse = await this.userModel.paginate(query, options)

      return {
        data: {
          pagination: usersResponse?.pagination || {},
          users: usersResponse?.docs.map((client) => this.userUtils.formatReturnData(client)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Finds a single user based on a search criteria (ID or email). This method retrieves the user and formats the data.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} search - The search criteria, which can be a user ID or an email address.
   * @returns {Promise<UserReturnData>} A promise that resolves to an object containing the formatted user data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (search: string): Promise<UserReturnData> => {
    try {
      const user = await this.findUser(search)
      return this.userUtils.formatReturnData(user)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Checks if a client exists based on a search criteria (ID or email). This method returns a boolean indicating
   * the existence of the user.
   *
   * @public
   * @async
   * @function clientExist
   * @param {string} search - The search criteria, which can be a user ID or an email address.
   * @returns {Promise<{ exist: boolean }>} A promise that resolves to an object containing the existence status.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public clientExist = async (search: string): Promise<{ exist: boolean }> => {
    try {
      const user = await this.findUser(search)
      return { exist: user ? true : false }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Updates an existing user with the provided details. This method updates the user in the database, logs the update event,
   * and returns the updated user data.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the user to update.
   * @param {UpdateUserDto} updateUserDto - Data Transfer Object containing the updated user details.
   * @param {User} userRequest - The user object of the requester, used for logging who initiated the update.
   * @param {string} clientIp - The IP address from which the update request originated, used for logging purposes.
   * @returns {Promise<object>} A promise that resolves to an object containing the updated user data.
   * @throws {NotFoundException} Throws this exception if the user with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateUserDto: UpdateUserDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const {
        country,
        billingAddress,
        gender,
        phoneNumber,
        residenceAddress,
      } = updateUserDto
      const user = await this.userModel.findById(id)
      if(!user) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      const userData = await this.userDataModel.findOne({ user: user.id})
      if(!userData) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }

      await user.updateOne({
        country,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await userData.updateOne({
        billingAddress,
        gender,
        phoneNumber,
        residenceAddress,
        updatedAt: this.dayjs.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user.email } was updated: ${ JSON.stringify(updateUserDto) }.`,
        module: 'Users',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Resets the password of a user based on their ID. The new password is set to the user's email address and hashed
   * for security. The method also logs the password reset event.
   *
   * @public
   * @async
   * @function resetPassword
   * @param {string} id - The ID of the user whose password is to be reset.
   * @param {User} userRequest - The user object of the requester, used for logging who initiated the reset.
   * @param {string} clientIp - The IP address from which the reset request originated, used for logging purposes.
   * @returns {Promise<void>} A promise that resolves when the password reset process is complete.
   * @throws {NotFoundException} Throws this exception if the user with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the reset process.
   */
  public resetPassword = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const user = await this.userModel.findById(id)
      if(!user) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      await user.updateOne({ 
        password: bcrypt.hashSync(`${ user.email.toLowerCase().trim() }`, 10),
        updatedAt: this.dayjs.getCurrentDateTime(),
        isLogged: false,
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user._id } was reset password.`,
        module: 'Users',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Deactivates a user based on their ID. This method updates the user's status to inactive, logs the deactivation event,
   * and does not return any data.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the user to deactivate.
   * @param {User} userRequest - The user object of the requester, used for logging who initiated the deactivation.
   * @param {string} clientIp - The IP address from which the deactivation request originated, used for logging purposes.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the user with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const user = await this.userModel.findById(id)
      if(!user) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      const userData = await this.userDataModel.findOne({ user: user.id})
      if(!userData) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      // await user.deleteOne()
      // await userData.deleteOne()
      await user.updateOne({
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await userData.updateOne({
        deleted: true,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: this.dayjs.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user._id } (${ user.email }) was deleted.`,
        module: 'Users',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public reactivate = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const user = await this.userModel.findById(id)
      if(!user) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      const userData = await this.userDataModel.findOne({ user: user.id})
      if(!userData) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      // await user.deleteOne()
      // await userData.deleteOne()
      await user.updateOne({
        deleted: false,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: null
      });
      await userData.updateOne({
        deleted: false,
        updatedAt: this.dayjs.getCurrentDateTime(),
        deletedAt: null
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user._id } (${ user.email }) was reactivated.`,
        module: 'Users',
        createdAt: this.dayjs.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
