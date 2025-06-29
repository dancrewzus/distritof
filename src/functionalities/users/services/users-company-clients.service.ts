import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions, Types } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'

import { RouteUser } from 'src/functionalities/routes/entities/routeUser.entity'
import { UserReturnData } from '../interfaces/user-return-data.interface'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { City } from 'src/functionalities/cities/entities/city.entity'
import { Company } from '../../companies/entities/company.entity'
import { Parameter } from 'src/functionalities/parameters/entities/parameter.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { MailAdapter } from 'src/common/adapters/mail.adapter'
import { UserCompany } from '../entities/userCompany.entity'
import { error } from 'src/common/constants/error-messages'
import { Image } from '../../images/entities/image.entity'
import { Track } from '../../tracks/entities/track.entity'
import { Role } from '../../roles/entities/role.entity'
import { UserData } from '../entities/userData.entity'
import { CreateUserDto, UpdateUserDto } from '../dto'
import { UserUtils } from '../utils/user.utils' 
import { Utils } from 'src/common/utils/utils'
import { User } from '../entities/user.entity'
import { ImagesService } from 'src/functionalities/images/images.service'

@Injectable()
export class UsersCompanyClientsService {

  private defaultLimit: number;
  private role: string = 'companyClient'

  constructor(
    @InjectModel(UserCompany.name, 'default') private readonly userCompanyModel: Model<UserCompany>,
    @InjectModel(RouteUser.name, 'default') private readonly routeUserModel: Model<RouteUser>,
    @InjectModel(UserData.name, 'default') private readonly userDataModel: Model<UserData>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Parameter.name, 'default') private readonly parameterModel: Model<Parameter>,
    @InjectModel(User.name, 'default') private readonly userModel: PaginateModel<User>,
    @InjectModel(Image.name, 'default') private readonly imageModel: Model<Image>,
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

  private async buildQuery(route: string, filter: string, databaseRoleId: string, companyId: string): Promise<any> {
    const baseQuery = {
      deleted: false,
      isActive: true,
    };

    // Si se pasa un companyId, buscamos en UserCompanies para obtener los usuarios relacionados con esa compañía
    if (companyId) {
      const userCompanies = await this.userCompanyModel.find({ company: companyId, isActive: true })
      const userIds = userCompanies.map(uc => uc.user);  // Extraemos los IDs de los usuarios

      baseQuery['_id'] = { $in: userIds };  // Filtramos usuarios que tengan relación con la compañía
    }

    if(route !== 'all') {
      const routeUser = await this.routeUserModel.find({ route, role: 'companyClient' })
      const routeIds = routeUser.map(ru => ru.id)
      baseQuery['routes'] = { $in: routeIds }
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

    const [
      roleResponse,
      companyResponse,
    ] = await Promise.all([
      this.roleModel.findOne({ name: this.role as string }),
      this.companyModel.findById(companyId)
    ])

    if(!roleResponse) {
      throw new NotFoundException(`Role with name '${ this.role }' not found`)
    }

    if(!companyResponse) {
      throw new NotFoundException(error.COMPANY_NOT_FOUND)
    }
    
    const { limit = this.defaultLimit, offset = 0, filter = '', route = 'all' } = paginationDto && !this.utils.isEmptyObject(paginationDto) 
      ? JSON.parse(paginationDto) 
      : { limit: this.defaultLimit, offset: 0, filter: '', route: 'all' };

    try {
      const query = await this.buildQuery(route, filter, roleResponse?.id, companyId);
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
  public create = async (
    createUserDto: CreateUserDto,
    userRequest: User,
    clientIp: string
  ): Promise<UserReturnData> => {
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
        routes,
        ...userDataDto
      } = createUserDto;
  
      const routeIds: string[] = [
        ...(Array.isArray(routes) ? routes : []),
        ...(route && route !== 'null' ? [route] : []),
      ];
  
      const [
        roleResponse,
        companyResponse,
        parametersResponse,
        cityResponse,
        userExist,
        usersByIdentifier,
        routeDocuments,
      ] = await Promise.all([
        this.roleModel.findOne({ name: this.role as string }),
        this.companyModel.findById(company).populate('users parameter'),
        this.parameterModel.findOne({ company }),
        this.cityModel.findById(city),
        this.userModel.findOne({ email: email.toLowerCase().trim() }).populate('role companies createdBy'),
        this.userModel.findOne({
          identifier,
          companies: { $not: { $elemMatch: { company } } }
        }).populate('role companies createdBy'),
        this.routeModel.find({ _id: { $in: routeIds } }).populate('users'),
      ]);
  
      if (role !== 'companyClient') {
        throw new NotFoundException(`Role with name "${role}" is invalid in this section`);
      }
  
      if (!roleResponse) throw new NotFoundException(`Role with id or name "${role}" not found`);
      if (!companyResponse) throw new NotFoundException(error.COMPANY_NOT_FOUND);
      if (!cityResponse) throw new NotFoundException(error.CITY_NOT_FOUND);
  
      if (routeIds.length && routeDocuments.length !== routeIds.length) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND);
      }
  
      if (usersByIdentifier && parametersResponse.validateCustomerDocument) {
        throw new ConflictException({
          message: error.USER_ALREADY_EXIST,
          data: this.userUtils.formatReturnData(usersByIdentifier),
          status: 409,
        });
      }
  
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime();
  
      if (userExist) {
        const userExistInCompany = userExist.companies.find((co) => String(co.company) === String(companyResponse.id));
  
        if (userExistInCompany) {
          if (userExist.role?.name === this.role && (userExist.isActive === false || userExist.deleted === true)) {
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
                description: `User ${userExist.email} (${companyResponse.name} / ${this.role}) was reactivated.`,
              }),
            ]);
            return;
          } else {
            throw new ConflictException({
              message: error.USER_ALREADY_EXIST,
              data: this.userUtils.formatReturnData(userExist),
              status: 409,
            });
          }
        } else {
          // 🔜 Lógica pendiente: crear vínculo entre usuario existente y nueva empresa
          return;
        }
  
      } else {
        const createdProfileImage = profilePictureDto
          ? await this.imagesService.create(profilePictureDto, userRequest, clientIp)
          : null;
  
        const createdAddressImage = addressPictureDto
          ? await this.imagesService.create(addressPictureDto, userRequest, clientIp)
          : null;
  
        const createdUser = await this.userModel.create({
          country,
          identifier,
          identifierType,
          isLogged: true,
          role: roleResponse.id,
          createdBy: userRequest.id,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
          email: email.toLowerCase().trim(),
          validationCode: this.utils.generateRandomCode(),
          password: bcrypt.hashSync(`${identifier}`, 10),
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
        } = userDataDto;
  
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
          identifierPicture: null,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
          profilePicture: createdProfileImage?.id || null,
          addressPicture: createdAddressImage?.id || null,
          cities: [cityResponse.id],
        });
  
        const createdUserCompany = await this.userCompanyModel.create({
          role: this.role,
          user: createdUser.id,
          createdAt: currentDateTime,
          updatedAt: currentDateTime,
          company: companyResponse.id,
        });
  
        createdUser.userData = createdUserData.id;
        createdUser.companies.push(createdUserCompany.id);
        companyResponse.users.push(createdUserCompany.id);
  
        // 🔁 Procesar cada ruta una a una
        for (const routeDoc of routeDocuments) {
          const freshRoute = await this.routeModel.findById(routeDoc.id).populate('users');
  
          freshRoute.users = freshRoute.users.filter((u) => u.role !== this.role);
  
          const createdRouteUser = await this.routeUserModel.create({
            role: this.role,
            user: createdUser.id,
            route: freshRoute.id,
            createdAt: currentDateTime,
            updatedAt: currentDateTime,
          });
  
          freshRoute.users.push(createdRouteUser.id);
          freshRoute.updatedAt = currentDateTime;
  
          createdUser.routes.push(createdRouteUser.id);
  
          await freshRoute.save(); // ✅ sin conflicto de versión
        }
  
        await Promise.all([
          createdUser.save(),
          createdUserData.save(),
          companyResponse.save(),
          this.trackModel.create({
            ip: clientIp,
            module: 'Users',
            user: userRequest.id,
            createdAt: currentDateTime,
            description: `User ${createdUser.email} (${companyResponse.name} / ${this.role}) was created.`,
          }),
        ]);
  
        await this.mail.sendValidationCode(createdUser);
  
        createdUser.createdBy = userRequest;
        return this.userUtils.formatReturnData(createdUser);
      }
  
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  };
  

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
  public update = async (
    id: string,
    updateUserDto: UpdateUserDto,
    userRequest: User,
    clientIp: string,
  ): Promise<object> => {
    try {
      const {
        city,
        routes,
        phoneNumber,
        billingAddress,
        residenceAddress,
      } = updateUserDto;
  
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime();
  
      const [
        userResponse,
        userDataResponse,
        cityResponse,
        newRoutesResponse,
      ] = await Promise.all([
        this.userModel.findById(id).populate('routes'),
        this.userDataModel.findOne({ user: id }).populate('cities'),
        this.cityModel.findById(city),
        this.routeModel.find({ _id: { $in: routes } }).populate('users'),
      ]);
  
      if (!userResponse || !userDataResponse) {
        throw new NotFoundException(error.USER_NOT_FOUND);
      }
  
      if (!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND);
      }
  
      if (!newRoutesResponse.length) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND);
      }
  
      // Siempre se actualiza la ciudad
      userDataResponse.cities = [cityResponse.id];
  
      const existingRouteIds = (userResponse.routes || []).map((r) => r._id.toString());
      const newRouteIds = routes.map((r) => r.toString());
  
      const isSameRoutes =
        existingRouteIds.length === newRouteIds.length &&
        newRouteIds.every((id) => existingRouteIds.includes(id));
  
      if (!isSameRoutes) {
        // Eliminar relaciones antiguas
        const oldRouteUsers = await this.routeUserModel.find({
          user: userResponse.id,
          role: this.role,
        });
  
        for (const rel of oldRouteUsers) {
          const route = await this.routeModel.findById(rel.route).populate('users');
          route.users = route.users.filter((u) => u.role !== this.role);
          route.updatedAt = currentDateTime;
          await rel.deleteOne();
          await route.save();
        }
  
        // Limpiar rutas anteriores del usuario
        userResponse.routes = [];
  
        // Crear nuevas relaciones y actualizar rutas una por una
        for (const route of newRoutesResponse) {
          const freshRoute = await this.routeModel.findById(route.id).populate('users');
  
          freshRoute.users = freshRoute.users.filter((u) => u.role !== this.role);
  
          const newRel = await this.routeUserModel.create({
            role: this.role,
            user: userResponse.id,
            route: freshRoute.id,
            createdAt: currentDateTime,
            updatedAt: currentDateTime,
          });
  
          userResponse.routes.push(newRel.id);
          freshRoute.users.push(newRel.id);
          freshRoute.updatedAt = currentDateTime;
  
          await freshRoute.save(); // 👈 evita el conflicto de versión
        }
      }
  
      // Datos generales del usuario
      userResponse.updatedAt = currentDateTime;
      userDataResponse.phoneNumber = phoneNumber;
      userDataResponse.billingAddress = billingAddress;
      userDataResponse.residenceAddress = residenceAddress;
      userDataResponse.updatedAt = currentDateTime;
  
      await Promise.all([
        userResponse.save(),
        userDataResponse.save(),
        this.trackModel.create({
          ip: clientIp,
          module: 'Users',
          user: userRequest.id,
          createdAt: currentDateTime,
          description: `User ${userResponse.email} was updated: ${JSON.stringify(updateUserDto)}.`,
        }),
      ]);
  
      return;
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  };
  
  
}
