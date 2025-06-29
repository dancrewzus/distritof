import { Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { Contract } from '../contracts/entities/contracts.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { error } from 'src/common/constants/error-messages'
import { RouteUser } from './entities/routeUser.entity'
import { Track } from '../tracks/entities/track.entity'
import { CreateRouteDto, UpdateRouteDto } from './dto'
import { City } from '../cities/entities/city.entity'
import { User } from '../users/entities/user.entity'
import { Route } from './entities/route.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class RoutesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(RouteUser.name, 'default') private readonly routeUserModel: Model<RouteUser>,
    @InjectModel(Contract.name, 'default') private readonly contractModel: Model<Contract>,
    @InjectModel(Route.name, 'default') private readonly routeModel: PaginateModel<Route>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(User.name, 'default') private readonly userModel: Model<User>,
    @InjectModel(City.name, 'default') private readonly cityModel: Model<City>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(
    filter: string,
    companyId: string,
    isAdmin: boolean,
    userResponse: User = null
  ): any {
    const baseQuery: any = { deleted: false };
  
    if (!isAdmin) {
      baseQuery['isActive'] = true;
    }
  
    baseQuery['company'] = companyId;
  
    // Si no es admin y hay un usuario, filtrar solo por las rutas asignadas
    if (!isAdmin && userResponse && Array.isArray(userResponse.routes)) {
      const routeIds = userResponse.routes
        .filter(r => r?.route?._id) // Evita rutas mal formadas
        .map(r => r.route._id);
  
      // Si no tiene rutas, asegurar que no retorne nada
      baseQuery['_id'] = { $in: routeIds.length > 0 ? routeIds : [null] };
    }
  
    // Si hay filtro, aplicar regex sobre el campo 'name'
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
          path: 'city'
        },
        {
          path: 'users',
          populate: 'user',
        }
      ]
    };
    return options;
  }

  /**
   * Finds a route by its ID. This method searches for the route in the database using its ID.
   * If the route is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findRoute
   * @param {string} id - The ID of the route to find.
   * @returns {Promise<Route>} A promise that resolves to the route object if found.
   * @throws {NotFoundException} Throws this exception if the route with the specified ID is not found.
   */
  private findRoute = async (id: string): Promise<Route> => {
    try {
      const route = await this.routeModel.findById(id)

      if(!route) {
        throw new NotFoundException(`Route with ID "${ id }" not found`)
      }
      return route
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for a route. This method structures the route data to be returned,
   * including the ID, name, and associated route. It only returns the data if the route is active.
   *
   * @private
   * @function formatReturnData
   * @param {Route} route - The route object to format.
   * @returns {object} An object containing the formatted route data, or undefined if the route is not active.
   */
  private formatReturnData = (route: Route): object => {

    const routeSupervisor = route.users.find((userRoute) => userRoute.role === 'companySupervisor')
    const routeWorker = route.users.find((userRoute) => userRoute.role === 'companyWorker')
    const supervisor = routeSupervisor ? routeSupervisor.user : null
    const worker = routeWorker ? routeWorker.user : null

    return {
      id: route?.id,
      isActive: route?.isActive || false,
      name: route?.name || '',
      description: route?.description || '',
      direction: route?.direction || '',
      phoneNumber: route?.phoneNumber || '',
      city: route?.city || {},
      company: route?.company || {},
      supervisor: supervisor ? {
        id: supervisor.id,
        fullname: `${ supervisor.firstName } ${ supervisor.paternalSurname }`,
      } : null,
      worker: worker ? {
        id: worker.id,
        fullname: `${ worker.firstName } ${ worker.paternalSurname }`,
      } : null,
      contracts: route.activeContracts,
    }
  }
  
  /**
   * Creates a new route. This method takes a DTO for creating a route, the user requesting the
   * creation, and the client's IP address. It saves the new route in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateRouteDto} createRouteDto - Data Transfer Object containing details for the new route.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created route.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createRouteDto: CreateRouteDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { company, city, name, description, direction, phoneNumber, supervisor, worker } = createRouteDto;

      const companyResponse = await this.companyModel.findById(company).populate('routes')
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      const cityResponse = await this.cityModel.findById(city).populate('routes')
      if(!cityResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      const createdRoute = await this.routeModel.create({
        name,
        description,
        direction,
        phoneNumber,
        company: companyResponse._id,
        city: cityResponse._id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      });

      if(supervisor && supervisor !== 'null') {

        const newSupervisorResponse = await this.userModel.findById(supervisor).populate('routes')
        if (!newSupervisorResponse) {
          throw new NotFoundException(error.USER_NOT_FOUND);
        }

        const createdRouteUser = await this.routeUserModel.create({
          user: newSupervisorResponse._id,
          route: createdRoute.id,
          role: 'companySupervisor',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        })

        newSupervisorResponse.routes.push(createdRouteUser.id)
        createdRoute.users.push(createdRouteUser.id)

        await Promise.all([
          newSupervisorResponse.save(),
          createdRoute.save(),
        ])
      }

      if(worker && worker !== 'null') {

        const newWorkerResponse = await this.userModel.findById(worker).populate('routes')
        if (!newWorkerResponse) {
          throw new NotFoundException(error.USER_NOT_FOUND);
        }

        const createdRouteUser = await this.routeUserModel.create({
          user: newWorkerResponse._id,
          route: createdRoute.id,
          role: 'companyWorker',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        })

        newWorkerResponse.routes.push(createdRouteUser.id)
        createdRoute.users.push(createdRouteUser.id)

        await Promise.all([
          newWorkerResponse.save(),
          createdRoute.save(),
        ])
      }
      
      companyResponse.routes.push(createdRoute.id)
      cityResponse.routes.push(createdRoute.id)

      await Promise.all([
        companyResponse.save(),
        cityResponse.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Route ${ createdRoute.name } (${ companyResponse.name }) was created.`,
          module: 'Routes',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

      return this.formatReturnData(createdRoute)

    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple routes with pagination and optional filtering. This method retrieves routes
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of routes. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered routes.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name)
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {

      let userResponse = null

      if(!isAdmin) {
        userResponse = await this.userModel.findById(userRequest.id).populate({
          path: 'routes',
          populate: {
            path: 'route'
          }
        })
        if(!userResponse) {
          throw new NotFoundException(error.USER_NOT_FOUND)
        }
      }
      
      const query = this.buildQuery(filter, companyId, isAdmin, userResponse);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const routesResponse = await this.routeModel.paginate(query, options);
      const { docs } = routesResponse

      const routes = []
      for (let index = 0; index < docs.length; index++) {
        const route = docs[index];
        
        const activeContracts = await this.contractModel.find({ route: route.id, isActive: true }).countDocuments()
        route.activeContracts = activeContracts
        
        routes.push(this.formatReturnData(route))
      }
      
      return {
        data: {
          pagination: routesResponse?.pagination || {},
          routes: routes,
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds a single route by its ID. This method uses the findCity method to retrieve the route's city
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the route to find.
   * @returns {Promise<object>} A promise that resolves to the formatted route data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const route = await this.routeModel.findById(id).populate('city')
      if(!route) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }
      return this.formatReturnData(route)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing route. This method finds the route by its ID, updates it with the provided
   * data, logs the update event, and returns the updated route data. If the route is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the route to update.
   * @param {UpdateRouteDto} updateRouteDto - Data Transfer Object containing the updated details for the route.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated route data.
   * @throws {NotFoundException} Throws this exception if the route with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (
    id: string, 
    updateRouteDto: UpdateRouteDto, 
    userRequest: User, 
    clientIp: string
  ): Promise<object> => {
    try {
      const { supervisor, worker, ...restOfData } = updateRouteDto;
  
      const routeResponse = await this.routeModel.findById(id).populate('users')
  
      if (!routeResponse) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND);
      }

      let role = null
      const { users } = routeResponse;
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()
      
      if (supervisor && supervisor !== 'null') {

        role = 'companySupervisor'

        const actualRouteSupervisor = users.find((routeUser) => routeUser.role === role)
        const actualRouteSupervisorId = actualRouteSupervisor ? actualRouteSupervisor.user : null

        if (String(actualRouteSupervisorId) !== String(supervisor)) {

          if (users.length && actualRouteSupervisorId) {
            const actualSupervisorResponse = await this.userModel.findById(actualRouteSupervisorId).populate('routes')
            if (!actualSupervisorResponse) {
              throw new NotFoundException(error.USER_NOT_FOUND);
            }
            actualSupervisorResponse.routes = actualSupervisorResponse.routes.filter((routeUser) => String(routeUser.route) === String(routeResponse._id))
            await actualRouteSupervisor.deleteOne()
          }

          const newSupervisorResponse = await this.userModel.findById(supervisor).populate('routes')
          if (!newSupervisorResponse) {
            throw new NotFoundException(error.USER_NOT_FOUND);
          }

          const createdRouteUser = await this.routeUserModel.create({
            role,
            route: routeResponse.id,
            createdAt: currentDateTime,
            updatedAt: currentDateTime,
            user: newSupervisorResponse.id,
          })

          newSupervisorResponse.routes.push(createdRouteUser.id)

          routeResponse.users = routeResponse.users.filter((routeUser) => routeUser.role !== role)
          routeResponse.users.push(createdRouteUser.id)

          await Promise.all([
            routeResponse.save(),
            newSupervisorResponse.save(),
          ])
        }
      }

      if (worker && worker !== 'null') {

        role = 'companyWorker'

        const actualRouteWorker = users.find((routeUser) => routeUser.role === role)
        const actualRouteWorkerId = actualRouteWorker ? actualRouteWorker.user : null

        if (String(actualRouteWorkerId) !== String(worker)) {

          if (users.length && actualRouteWorkerId) {
            const actualWorkerResponse = await this.userModel.findById(actualRouteWorkerId).populate('routes')
            if (!actualWorkerResponse) {
              throw new NotFoundException(error.USER_NOT_FOUND);
            }
            actualWorkerResponse.routes = actualWorkerResponse.routes.filter((routeUser) => String(routeUser.route) === String(routeResponse._id))
            await actualRouteWorker.deleteOne()
          }
          
          const newWorkerResponse = await this.userModel.findById(worker).populate('routes')
          if (!newWorkerResponse) {
            throw new NotFoundException(error.USER_NOT_FOUND);
          }

          const createdRouteUser = await this.routeUserModel.create({
            role,
            route: routeResponse.id,
            createdAt: currentDateTime,
            updatedAt: currentDateTime,
            user: newWorkerResponse.id,
          })

          newWorkerResponse.routes.push(createdRouteUser.id)

          routeResponse.users = routeResponse.users.filter((routeUser) => routeUser.role !== role)
          routeResponse.users.push(createdRouteUser.id)

          await Promise.all([
            routeResponse.save(),
            newWorkerResponse.save(),
          ])
        }
      }
      
      await Promise.all([
        routeResponse.updateOne({
          ...restOfData,
          updatedAt: currentDateTime,
        }),
        this.trackModel.create({
          ip: clientIp,
          module: 'Routes',
          user: userRequest.id,
          createdAt: currentDateTime,
          description: `Route ${routeResponse.id} was updated: ${JSON.stringify(updateRouteDto)}.`,
        })
      ])
  
      return { ...routeResponse.toJSON(), ...updateRouteDto };

    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  };  
  
  /**
   * Deactivates a route by its ID. This method updates the route's status to inactive, logs the
   * deactivation event, and does not return any data. If the route is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the route to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the route with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {
      const route = await this.routeModel.findById(id)
      if(!route) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }
      await route.updateOne({
        deleted: true,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        deletedAt: this.dayjsAdapter.getCurrentDateTime()
      });
      await this.trackModel.create({
        ip: clientIp,
        description: `Route ${ route.id } was deactivated.`,
        module: 'Routes',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
