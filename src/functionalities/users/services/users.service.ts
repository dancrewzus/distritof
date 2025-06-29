import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions, isObjectIdOrHexString } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'

import { RouteUser } from 'src/functionalities/routes/entities/routeUser.entity'
import { UserReturnData } from '../interfaces/user-return-data.interface'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { City } from 'src/functionalities/cities/entities/city.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { Company } from '../../companies/entities/company.entity'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { MailAdapter } from 'src/common/adapters/mail.adapter'
import { UserCompany } from '../entities/userCompany.entity'
import { error } from 'src/common/constants/error-messages'
import { Image } from '../../images/entities/image.entity'
import { Track } from '../../tracks/entities/track.entity'
import { Role } from '../../roles/entities/role.entity'
import { UserData } from '../entities/userData.entity'
import { CreateUserDto, UpdateUserDto } from '../dto'
import { Utils } from 'src/common/utils/utils'
import { User } from '../entities/user.entity'
import { UserUtils } from '../utils/user.utils'
import { ImagesService } from 'src/functionalities/images/images.service'

@Injectable()
export class UsersService {

  private defaultLimit: number;

  constructor(
    @InjectModel(UserCompany.name, 'default') private readonly userCompanyModel: Model<UserCompany>,
    @InjectModel(RouteUser.name, 'default') private readonly routeUserModel: Model<RouteUser>,
    @InjectModel(UserData.name, 'default') private readonly userDataModel: Model<UserData>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(User.name, 'default') private readonly userModel: PaginateModel<User>,
    @InjectModel(Route.name, 'default') private readonly routeModel: Model<Route>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(City.name, 'default') private readonly cityModel: Model<City>,
    @InjectModel(Role.name, 'default') private readonly roleModel: Model<Role>,
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly userUtils: UserUtils,
    private readonly mail: MailAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private async buildQuery(filter: string, databaseRoleId: string, companyId: string, isAdmin: boolean): Promise<any> {
    const baseQuery = { deleted: false };

    if (!isAdmin) {
      baseQuery['isActive'] = true;
    }

    // Si se pasa un companyId, buscamos en UserCompanies para obtener los usuarios relacionados con esa compañía
    if (companyId) {
      const userCompanies = await this.userCompanyModel.find({ company: companyId, isActive: true }).exec();
      const userIds = userCompanies.map(uc => uc.user);  // Extraemos los IDs de los usuarios

      baseQuery['_id'] = { $in: userIds };  // Filtramos usuarios que tengan relación con la compañía
    }

    if (databaseRoleId) {
      baseQuery['role'] = databaseRoleId;
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
          path: 'companies',
          populate: {
            path: 'company',
            populate: {
              path: 'licenses country'
            }
          }
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
                  .populate('createdBy country identifierType companies')
                  .populate({ 
                    path: 'companies', 
                    populate: {
                      path: 'company',
                      populate: 'licenses country'
                    }
                  })
                  .populate({ 
                    path: 'userData',
                    populate: {
                      path: 'profilePicture addressPicture identifierPicture cities'
                    }
                  })
                  .populate({ 
                    path: 'routes',
                    populate: {
                      path: 'route'
                    }
                  })
          break;
        case 'email':
          user = await this.userModel.findOne({ email: search.toLocaleLowerCase() })
                  .populate({ path: 'role', select: 'name' })
                  .populate('createdBy country identifierType companies')
                  .populate({ 
                    path: 'companies', 
                    populate: {
                      path: 'company',
                      populate: 'licenses country'
                    }
                  })
                  .populate({ 
                    path: 'userData',
                    populate: {
                      path: 'profilePicture addressPicture identifierPicture cities'
                    }
                  })
                  .populate({ 
                    path: 'routes',
                    populate: {
                      path: 'route'
                    }
                  })
        case 'identifier':
          user = await this.userModel.findOne({ identifier: parseInt(search, 10) })
                  .populate({ path: 'role', select: 'name' })
                  .populate('createdBy country identifierType companies')
                  .populate({ 
                    path: 'companies', 
                    populate: {
                      path: 'company',
                      populate: 'licenses country'
                    }
                  })
                  .populate({ 
                    path: 'userData',
                    populate: {
                      path: 'profilePicture addressPicture identifierPicture cities'
                    }
                  })
                  .populate({ 
                    path: 'routes',
                    populate: {
                      path: 'route'
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
  private searchType = (search: string): string => {
    if (isObjectIdOrHexString(search)) {
      return 'id'
    }
    if (this.utils.validateEmail(`${ search }`)) {
      return 'email'
    }
    if (Number.isFinite(parseInt(search, 10))) {
      return 'identifier'
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
        profilePictureDto,
        addressPictureDto,
        identifierPicture,
        city,
        route,
        ...userDataDto
      } = createUserDto;

      if (role === 'companyClient') {
        throw new NotFoundException(`Role with name "${ role }" is invalid in this section`)
      }

      const databaseRole = await this.roleModel.findOne({ name: role as string })
      if(!databaseRole) {
        throw new NotFoundException(`Role with id or name "${ role }" not found`)
      }

      const companyResponse = await this.companyModel.findById(company).populate('users')
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const cityResponse = await this.cityModel.findById(city)
      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      const routeResponse = route ? await this.routeModel.findById(route).populate('users') : null
      if(!routeResponse && ![ 'companyAdmin', 'companyOwner', 'companySupervisor' ].includes(role)) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }

      if(routeResponse) {
      const { users } = routeResponse 
        switch (role) {
          case 'companySupervisor':
            const routeSupervisor = users.find((routeUser) => routeUser.role === 'companySupervisor')
            if(routeSupervisor) {
              throw new ConflictException(error.ROUTE_ALREADY_HAVE_SUPERVISOR)
            }
            break;

          case 'companyWorker':
            const routeWorker = users.find((routeUser) => routeUser.role === 'companyWorker')
            if(routeWorker) {
              throw new ConflictException(error.ROUTE_ALREADY_HAVE_WORKER)
            }
            break;
        
          default:
            break;
        }
      }

      const userExist = await this.userModel.findOne({ email }).populate('role')

      if(userExist) {
        if(userExist.role?.name === `${ role }` && (userExist.isActive === false || userExist.deleted === true)) {
          await userExist.updateOne({
            isActive: true,
            deleted: false,
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            deletedAt: null,
          });
  
          await this.trackModel.create({
            ip: clientIp,
            description: `User ${ userExist.email } (${ companyResponse.name } / ${ role }) was reactivated.`,
            module: 'Users',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        } else {
          throw new ConflictException({
            message: error.USER_ALREADY_EXIST,
            data: this.userUtils.formatReturnData(userExist),
            status: 409
          })
        }

      } else {

        let createdProfileImage = null
        if(profilePictureDto) {
          createdProfileImage = await this.imagesService.create(profilePictureDto, userRequest, clientIp);
        }
        
        let createdAddressImage = null
        if(addressPictureDto) {
          createdAddressImage = await this.imagesService.create(addressPictureDto, userRequest, clientIp);
        }
        
        // let databaseIdentifierPicture = null
        // if(identifierPicture !== '') {
        //   databaseIdentifierPicture = await this.imageModel.findById(addressPicture)
        //   if(!databaseIdentifierPicture) {
        //     throw new NotFoundException(`Identifier photo with id "${ addressPicture }" not found`)
        //   }
        // }
  
        const isAdmin = ['admin','root'].includes(databaseRole.name)
        
        const createdUser = await this.userModel.create({
          country,
          identifier,
          identifierType,
          firstName: this.utils.capitalizeFirstLetter(firstName).trim(),
          paternalSurname: this.utils.capitalizeFirstLetter(paternalSurname).trim(),
          email: email.toLowerCase().trim(),
          password: bcrypt.hashSync(`${ password ? password : (databaseRole.name === 'admin' ? email : identifier) }`, 10),
          validationCode: this.utils.generateRandomCode(),
          role: databaseRole.id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
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
          entryDate,
        } = userDataDto
  
        const createdUserData = await this.userDataModel.create({
          gender,
          billingAddress,
          residenceAddress,
          phoneNumber,
          identifierExpireDate,
          securityQuestion,
          securityAnswer,
          user: createdUser.id,
          profilePicture: createdProfileImage?.id || null,
          addressPicture: createdAddressImage?.id || null,
          identifierPicture: null,// databaseIdentifierPicture?._id,
          entryDate,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        })
        
        const createdUserCompany = await this.userCompanyModel.create({
          user: createdUser.id,
          company: companyResponse._id,
          role,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        })
  
        createdUser.userData = createdUserData.id
        createdUser.companies.push(createdUserCompany.id)
        companyResponse.users.push(createdUserCompany.id)
        
        createdUserData.cities = []
        createdUserData.cities.push(cityResponse.id) // id or _id ? 
        
        if (routeResponse) {

          const createdRouteUser = await this.routeUserModel.create({
            user: createdUser.id,
            route: routeResponse._id,
            role,
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
          })

          routeResponse.users.push(createdRouteUser.id)
          createdUser.routes.push(createdRouteUser.id)
          await routeResponse.save()
        }
  
        await Promise.all([
          createdUser.save(),
          companyResponse.save(),
          createdUserData.save(),
          this.trackModel.create({
            ip: clientIp,
            description: `User ${ createdUser.email } (${ companyResponse.name } / ${ role }) was created.`,
            module: 'Users',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        ])
  
        if(!isAdmin) {
          await this.mail.sendValidationCode(createdUser)
        }
      }
      
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
  public findUsers = async (paginationDto: any = {}, role: string = null, companyId: string, userRequest: User) => {

    let databaseRole = null
    if(role && role !== 'null') {
      databaseRole = await this.roleModel.findOne({ name: role as string })
      if(!databaseRole) {
        throw new NotFoundException(`Role with name ${ role } not found`)
      }
    }

    const companyResponse = await this.companyModel.findById(companyId)
    if(!companyResponse) {
      throw new NotFoundException(error.COMPANY_NOT_FOUND)
    }
    
    const isAdmin = ['root', 'admin'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};

    try {
      const query = await this.buildQuery(filter, databaseRole?._id, companyId, isAdmin);
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
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })
      await userData.updateOne({
        billingAddress,
        gender,
        phoneNumber,
        residenceAddress,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user.email } was updated: ${ JSON.stringify(updateUserDto) }.`,
        module: 'Users',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
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
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        isLogged: false,
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user._id } was reset password.`,
        module: 'Users',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
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
      const user = await this.userModel.findById(id).populate('role companies routes')
      if(!user) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      const userData = await this.userDataModel.findOne({ user: user.id})
      if(!userData) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      const { role, companies, routes } = user
      
      if(role.name === 'companyWorker') {
        if(routes.length) {
          const routeUser = routes[0]
          const { route } = routeUser

          const routeResponse = await this.routeModel.findById(route).populate('users')

          routeResponse.users = routeResponse?.users?.filter(item => item.role !== 'companyWorker') || [];

          await Promise.all([
            this.routeUserModel.deleteOne({ id: routeUser._id }),
            routeResponse.save()
          ])
        }
      }      
      if(role.name === 'companyAdmin') {
        
        if(companies.length) {
          const { company } = companies[0]
          const companyResponse = await this.companyModel.findById(company).populate('users')
          
          const { users } = companyResponse
  
          const companyUsersToKeep = users.filter((companyUser) => companyUser.role !== role.name)
          companyResponse.users = companyUsersToKeep
  
          await this.userCompanyModel.deleteMany({
            role: role.name,
            company: companyResponse._id,
          })
        }
      } 

      await Promise.all([
        user.updateOne({
          deleted: true,
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
          deletedAt: this.dayjsAdapter.getCurrentDateTime()
        }),
        userData.updateOne({
          deleted: true,
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
          deletedAt: this.dayjsAdapter.getCurrentDateTime()
        }),
        this.trackModel.create({
          ip: clientIp,
          description: `User ${ user._id } (${ user.email }) was deleted.`,
          module: 'Users',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

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
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: null
      });
      await userData.updateOne({
        deleted: false,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: null
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${ user._id } (${ user.email }) was reactivated.`,
        module: 'Users',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
