import { Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { ContractUtils } from '../contracts/utils/contract.utils'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { ContractPending } from './entities/pending.entity'
import { error } from 'src/common/constants/error-messages'
import { Route } from '../routes/entities/route.entity'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class PendingService {

  private defaultLimit: number;

  constructor(
    @InjectModel(ContractPending.name, 'default') private readonly pendingModel: PaginateModel<ContractPending>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Route.name, 'default') private readonly routeModel: Model<Route>,
    private readonly configService: ConfigService,
    private readonly contractUtils: ContractUtils,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly handleErrors: HandleErrors,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(type: string, filter: string, company: Company, route: Route, userRequest: User): any {

    const isSearch = filter !== '' ? true : false
    
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name)

    const baseQuery = { 
      deleted: false,
      isActive: true,
      route: !route ? { $exists: true } : route.id,
    };
    
    baseQuery['company'] = company.id;

    let filteredData = {}

    switch (type) {
      case 'updated':
        filteredData = {
          $or: [
            { 
              $and: [
                { daysAhead: { $gt: 0 }}, // 🔹 Si tiene días adelantados
                { pendingAmount: { $gt: 0 }}, // 🔹 El saldo pendiente es mayor a 0
              ]
            },
            {
              $and: [
                { paymentsIncomplete: { $eq: 0 }}, // 🔹 No tiene pagos incompletos
                { paymentsLate: { $eq: 0 }}, // 🔹 No tiene pagos atrasados
                { daysExpired: { $eq: 0 }}, // 🔹 No está vencido
                { pendingAmount: { $gt: 0 }}, // 🔹 El saldo pendiente es mayor a 0
              ]
            }
          ]
        }
        break;

      case 'late':
        filteredData = {
          $and: [
            {
              $or: [
                { todayIncomplete: { $eq: true }}, // 🔹 Si tiene un pago incompleto hoy
                { paymentsLate: { $gt: 0 }}, // 🔹 Si tiene pagos atrasados
              ],
            },
            { daysExpired: { $eq: 0 }}, // Días expirados igual a 0
            { daysAhead: { $eq: 0 }}, // Días adelantados igual a 0
          ],
        }  
        break;

      case 'expired':
        filteredData = {
          $and: [
            { daysAhead: { $eq: 0 }},
            { daysExpired: { $gt: 0 }},
          ]
        }
        break;

      default: break;
    }

    let data: any = {
      worker: isAdmin ? { $exists: true } : userRequest.id,
      ...filteredData
    }
  
    if (isSearch) {
      data = {
        $or: [
          { 
            clientName: new RegExp(filter, 'i'),
            worker: isAdmin ? { $exists: true } : userRequest.id,
            ...filteredData
          },
        ],
      };
    }
  
    return { ...baseQuery, ...data };
  }
  
  private buildOptions(offset: number, limit: number): PaginateOptions {
    const options: PaginateOptions = {
      offset,
      limit,
      sort: {
        lastPaymentDate: -1,   // -1 = descendente (más reciente primero)
        clientName: 1          //  1 = ascendente (opcional, por si empatan en la fecha)
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [ 
        { 
          path: 'client',
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
          ]
        }, 
        {
          path: 'contract',
          populate: [
            {
              path: 'notes',
              populate: { path: 'createdBy' }
            },
            {
              path: 'modality',
            },
          ]
        }
      ]
    };
    return options;
  }
  
  /**
   * Finds multiple notes with pagination and optional filtering. This method retrieves notes
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of notes. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered notes.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (
    paginationDto: any = {},
    userRequest: User,
    company: string,
    route: string
  ) => {

    try {
    
      const [
        companyResponse,
        routeResponse,
      ] = await Promise.all([
        this.companyModel.findById(company),
        this.routeModel.findById(route !== 'all' ? route : null),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      if(route !== 'all' && !routeResponse) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }

      // const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);

      const { limit = this.defaultLimit, offset = 0, filter = '', type } = paginationDto && !this.utils.isEmptyObject(paginationDto)
        ? JSON.parse(paginationDto) 
        : { limit: this.defaultLimit, offset: 0, filter: '', type: '' };
    
      const query = this.buildQuery(type, filter, companyResponse, routeResponse, userRequest);
      const options = this.buildOptions(offset, limit)
      
      const pendingResponse = await this.pendingModel.paginate(query, options)
      
      return {
        data: {
          pagination: pendingResponse?.pagination || {},
          pending: pendingResponse?.docs.map((pending) => this.contractUtils.formatReturnContractPending(pending)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds multiple notes with pagination and optional filtering. This method retrieves notes
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of notes. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function getResume
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered notes.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public getResume = async (
    userRequest: User,
    company: string,
    route: string
  ): Promise<any> => {
    try {

      const [
        companyResponse,
        routeResponse,
      ] = await Promise.all([
        this.companyModel.findById(company),
        this.routeModel.findById(route !== 'all' ? route : null),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      if(route !== 'all' && !routeResponse) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }

      const { role }= userRequest
      const { name } = role
      const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(name)

      await this.pendingModel.updateMany(
        { isActive: { $exists: false } }, // sólo los que no lo tienen
        { $set: { isActive: true } }
      );
      
      const contractPendingArray = await this.pendingModel.find({
        isActive: true,
        company: companyResponse.id,
        route: route === 'all' ? { $exists: true } : routeResponse.id,
        worker: isAdmin ? { $exists: true } : userRequest.id,
      }).populate('client')

      const currentDate = this.dayjsAdapter.getCurrentDate()

      let totalUpdated = 0
      let totalLate = 0
      let totalExpired = 0
      let totalUpdatedPayed = 0
      let totalLatePayed = 0
      let totalExpiredPayed = 0

      for (let index = 0; index < contractPendingArray.length; index++) {
        const contractPending = contractPendingArray[index];

        const { client, paymentsIncomplete, daysExpired, paymentsLate, daysAhead, todayIncomplete, pendingAmount, lastPaymentDate } = contractPending
        
        const lastPayment = this.dayjsAdapter.getFormattedDateFromDateTime(lastPaymentDate)
        
        const payedToday = currentDate === lastPayment
        
        if(client) {
          
          // ✅ Updated: Solo si NO tiene pagos atrasados ni incompletos (pero puede tener días pendientes)
          if ((daysAhead > 0 && pendingAmount > 0) || (paymentsIncomplete == 0 && paymentsLate == 0 && daysExpired == 0 && pendingAmount > 0)) {
            totalUpdated += 1;

            if(payedToday) {
              totalUpdatedPayed += 1
            }
          }
  
          // ✅ Late: Solo si tiene pagos atrasados o incompletos hoy (pero ya no se considera `daysPending` como único criterio)
          if ((todayIncomplete || paymentsLate > 0) && daysExpired === 0 && daysAhead === 0) {
            totalLate += 1;

            if(payedToday) {
              totalLatePayed += 1
            }
          }
  
          if(daysExpired > 0 && daysAhead === 0) {
            totalExpired += 1

            if(payedToday) {
              totalExpiredPayed += 1
            }
          }
        }
      }
      
      return {
        data: {
          totalUpdated: {
            payed: totalUpdatedPayed,
            count: totalUpdated,
            percent: (totalUpdated / contractPendingArray.length) * 100
          },
          totalLate: {
            payed: totalLatePayed,
            count: totalLate,
            percent: (totalLate / contractPendingArray.length) * 100
          },
          totalExpired: {
            payed: totalExpiredPayed,
            count: totalExpired,
            percent: (totalExpired / contractPendingArray.length) * 100
          },
          totalPayed: totalUpdatedPayed + totalLatePayed + totalExpiredPayed
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
