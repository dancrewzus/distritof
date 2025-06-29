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
import { UserCompany } from '../entities/userCompany.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { City } from 'src/functionalities/cities/entities/city.entity'
import { RouteUser } from 'src/functionalities/routes/entities/routeUser.entity'
import { UserUtils } from '../utils/user.utils'

@Injectable()
export class UsersCompanyWorkersService {

  private defaultLimit: number;
  private role: string = 'companyWorker'

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
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly userUtils: UserUtils,
    private readonly mail: MailAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private async buildQuery(filter: string, databaseRoleId: string, companyId: string): Promise<any> {
    const baseQuery = {
      deleted: false,
      isActive: true,
    };

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
          path: 'createdBy country identifierType'
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
            path: 'profilePicture addressPicture identifierPicture cities'
          }
        },
        {
          path: 'routes',
          populate: {
            path: 'route'
          }
        }
      ],
      customLabels: {
        meta: 'pagination',
      },
    };
    return options;
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
  public findUsers = async (paginationDto: any = {}, companyId: string) => {

    const databaseRole = await this.roleModel.findOne({ name: this.role as string })
    if(!databaseRole) {
      throw new NotFoundException(`Role with name '${ this.role }' not found`)
    }

    const companyResponse = await this.companyModel.findById(companyId)
    if(!companyResponse) {
      throw new NotFoundException(error.COMPANY_NOT_FOUND)
    }
    
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};

    try {
      const query = await this.buildQuery(filter, databaseRole?.id, companyId);
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
        city,
        email,
        route,
        country,
        company,
        identifier,
        identifierType,
        firstName,
        paternalSurname,
        ...userDataDto
      } = createUserDto;

      const [
        roleResponse,
        companyResponse,
        cityResponse,
        routeResponse
      ] = await Promise.all([
        this.roleModel.findOne({ name: this.role as string }),
        this.companyModel.findById(company).populate('users'),
        this.cityModel.findById(city),
        route !== 'null' ? this.routeModel.findById(route).populate('users') : null
      ])
      
      if(!roleResponse) {
        throw new NotFoundException(`Role with id or name "${ this.role }" not found`)
      }

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      if(route !== 'null' && !routeResponse) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }

      if(routeResponse) {
        const { users } = routeResponse
        const routeWorker = users.find((routeUser) => routeUser.role === this.role)
        if(routeWorker) {
          throw new ConflictException(error.ROUTE_ALREADY_HAVE_WORKER)
        } 
      }

      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()
      const userExist = await this.userModel.findOne({ email }).populate('role')

      if(userExist) {
        if(userExist.role?.name === this.role && (userExist.isActive === false || userExist.deleted === true)) {
          await Promise.all([
            userExist.updateOne({
              isActive: true,
              deleted: false,
              updatedAt: currentDateTime,
            }),
            this.trackModel.create({
              ip: clientIp,
              module: 'Users',
              user: userRequest.id,
              createdAt: currentDateTime,
              description: `User ${ userExist.email } (${ companyResponse.name } / ${ this.role }) was reactivated.`,
            }),
          ])
        } else {
          throw new ConflictException({
            message: error.USER_ALREADY_EXIST,
            data: this.userUtils.formatReturnData(userExist),
            status: 409,
          })
        }
      } else {        
        const createdUser = await this.userModel.create({
          country,
          identifier,
          identifierType,
          isLogged: true,
          role: roleResponse.id,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
          email: email.toLowerCase().trim(),
          validationCode: this.utils.generateRandomCode(),
          password: bcrypt.hashSync(`${ identifier }`, 10),
          firstName: this.utils.capitalizeFirstLetter(firstName).trim(),
          paternalSurname: this.utils.capitalizeFirstLetter(paternalSurname).trim(),
        });
  
        const {
          gender,
          entryDate,
          phoneNumber,
          billingAddress,
          securityAnswer,
          securityQuestion,
          residenceAddress,
          identifierExpireDate,
        } = userDataDto
  
        const createdUserData = await this.userDataModel.create({
          gender,
          entryDate,
          phoneNumber,
          securityAnswer,
          billingAddress,
          securityQuestion,
          residenceAddress,
          identifierExpireDate,
          user: createdUser.id,
          profilePicture: null,
          addressPicture: null,
          identifierPicture: null,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        })
        
        const createdUserCompany = await this.userCompanyModel.create({
          role: this.role,
          user: createdUser.id,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
          company: companyResponse.id,
        })
  
        createdUser.userData = createdUserData.id
        createdUser.companies.push(createdUserCompany.id)
        companyResponse.users.push(createdUserCompany.id)
        
        createdUserData.cities = []
        createdUserData.cities.push(cityResponse.id)
        
        if (routeResponse) {

          const createdRouteUser = await this.routeUserModel.create({
            role: this.role,
            user: createdUser.id,
            route: routeResponse._id,
            createdAt: currentDateTime,
            updatedAt: currentDateTime,
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
            module: 'Users',
            user: userRequest.id,
            createdAt: currentDateTime,
            description: `User ${ createdUser.email } (${ companyResponse.name } / ${ this.role }) was created.`,
          })
        ])
  
        await this.mail.sendValidationCode(createdUser)
      }
      
      return
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
        city,
        route,
        phoneNumber,
      } = updateUserDto

      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()

      const [
        userResponse,
        userDataResponse,
        cityResponse,
        newRouteResponse,
      ] = await Promise.all([
        this.userModel.findById(id).populate('routes'),
        this.userDataModel.findOne({ user: id }).populate('cities'),
        this.cityModel.findById(city),
        this.routeModel.findById(route).populate('users'),
      ])

      if(!userResponse || !userDataResponse) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }

      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      if (!newRouteResponse) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND);
      }

      // Si la ciudad es distinta se cambia (Siempre se cambia)
      userDataResponse.cities = []
      userDataResponse.cities.push(cityResponse.id)

      // Si la ruta es distinta se cambia
      const { routes } = userResponse
      const { users } = newRouteResponse

      const isSameRoute = routes.find((r) => String(r.route) === String(newRouteResponse.id))

      if(!isSameRoute) {
        
        if (routes.length) {
          const actualRouteUserResponse = await this.routeUserModel.findOne({
            role: this.role,
            user: userResponse.id,
          })
  
          if (actualRouteUserResponse) {
            const actualRouteResponse = await this.routeModel.findById(actualRouteUserResponse.route).populate('users')
    
            actualRouteResponse.users = actualRouteResponse.users.filter((routeUser) => routeUser.role !== this.role)
            actualRouteResponse.updatedAt = currentDateTime
    
            await Promise.all([
              actualRouteUserResponse.deleteOne(),
              actualRouteResponse.save(),
            ])
          }
        }

        if (users.length) {
          const actualRouteUserResponse = await this.routeUserModel.findOne({
            role: this.role,
            route: newRouteResponse.id,
          })
          
          if (actualRouteUserResponse) {
            const actualUserResponse = await this.userModel.findById(actualRouteUserResponse.user).populate('routes')
  
            actualUserResponse.routes = actualUserResponse.routes.filter((routeUser) => routeUser.role !== this.role)
            actualUserResponse.updatedAt = currentDateTime
    
            await Promise.all([
              actualRouteUserResponse.deleteOne(),
              actualUserResponse.save(),
            ])
          }

        }

        const createdRouteUser = await this.routeUserModel.create({
          role: this.role,
          user: userResponse.id,
          route: newRouteResponse.id,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
        })

        userResponse.routes = []
        userResponse.routes.push(createdRouteUser.id)

        newRouteResponse.users = users.filter((routeUser) => routeUser.role !== this.role)
        newRouteResponse.users.push(createdRouteUser.id)
        newRouteResponse.updatedAt = currentDateTime
      }
      
      userResponse.updatedAt = currentDateTime
      userDataResponse.phoneNumber = phoneNumber
      userDataResponse.updatedAt = currentDateTime
      
      await Promise.all([
        userResponse.save(),
        userDataResponse.save(),
        newRouteResponse.save(),
        this.trackModel.create({
          ip: clientIp,
          module: 'Users',
          user: userRequest.id,
          createdAt: currentDateTime,
          description: `User ${ userResponse.email } was updated: ${ JSON.stringify(updateUserDto) }.`,
        })
      ])
      
      return
    
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
