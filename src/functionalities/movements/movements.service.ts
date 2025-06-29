import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { Parameter } from 'src/functionalities/parameters/entities/parameter.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { ImagesService } from 'src/functionalities/images/images.service'
import { Image } from 'src/functionalities/images/entities/image.entity'
import { Track } from 'src/functionalities/tracks/entities/track.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { User } from 'src/functionalities/users/entities/user.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { ContractUtils } from '../contracts/utils/contract.utils'
import { CloudAdapter } from 'src/common/adapters/cloud.adapter'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { CreateMovementDto } from './dto/create-movement.dto'
import { error } from 'src/common/constants/error-messages'
import { Movement } from './entities/movement.entity'
import { Utils } from 'src/common/utils/utils'
import { ContractPayment } from '../contract-payments/entities/payment.entity'

@Injectable()
export class MovementsService {

  private defaultLimit: number;

  constructor(
    @InjectModel(ContractPayment.name, 'default') private readonly paymentModel: Model<ContractPayment>,
    @InjectModel(Movement.name, 'default') private readonly movementModel: PaginateModel<Movement>,
    @InjectModel(Parameter.name, 'default') private readonly parameterModel: Model<Parameter>,
    @InjectModel(Contract.name, 'default') private readonly contractModel: Model<Contract>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    // @InjectModel(Image.name, 'default') private readonly imageModel: Model<Image>,
    @InjectModel(User.name, 'default') private readonly userModel: Model<User>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(Route.name, 'default') private readonly routeModel: Model<Route>,
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly contractUtils: ContractUtils,
    private readonly cloudAdapter: CloudAdapter,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, companyId: string, userRequest: User): any {
    const baseQuery = {
      company: companyId,
      status: 'pending',
      deleted: false,
      type: { $ne: 'out' },
      // createdBy: userRequest ? userRequest.id : { $exists: true }, // Es necesario?
    }
    
    const isSearch = filter !== '' ? true : false

    if (filter.toLocaleLowerCase() === 'banco') filter = 'bank'
    if (filter.toLocaleLowerCase() === 'efectivo') filter = 'cash'

    if (isSearch) {
      return {
        ...baseQuery,
        $or: [
          { movementNumber: new RegExp(filter, 'i') },
          { description: new RegExp(filter, 'i') },
          { paymentType: new RegExp(filter, 'i') },
          { comment: new RegExp(filter, 'i') },
          { amount: new RegExp(filter, 'i') },
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
        createdAt: 'asc',
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [
        {
          path: 'route paymentPicture createdBy'
        },
      ]
    };
    return options;
  }

  /**
   * Formats the return data for a movement. This method structures the movement data to be returned,
   * including the ID, name, and associated movement. It only returns the data if the movement is active.
   *
   * @private
   * @function formatReturnData
   * @param {Route} movement - The movement object to format.
   * @returns {object} An object containing the formatted movement data, or undefined if the movement is not active.
   */
  private formatReturnData = (movement: Movement) => {
    return {
      id: movement?.id,
      createdBy: this.utils.getFullnameFromUser(movement?.createdBy),
      route: movement?.route?.name || {},
      paymentPicture: movement?.paymentPicture?.imageUrl || null,
      amount: movement?.amount || 0,
      description: movement?.description || '',
      paymentType: movement?.paymentType ? ( movement?.paymentType === 'bank' ? 'Banco' : 'Efectivo' ) : 'Sin ingresar',
      createdAt: movement?.createdAt || '',
    }
  }
  
  /**
   * Creates a new movement. This method takes a DTO for creating a movement, the user requesting the
   * creation, and the client's IP address. It saves the new movement in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateMovementDto} createMovementDto - Data Transfer Object containing details for the new movement.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created movement.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createMovementsDto: CreateMovementDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      
      const {
        company,
        createImageDto,
        amount,
        type,
        description,
      } = createMovementsDto

      const [
        companyResponse,
        parametersResponse,
      ] = await Promise.all([
        this.companyModel.findById(company),
        this.parameterModel.findOne({ company }),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const currentDate = this.dayjsAdapter.getCurrentDate()
      const { journalStart, journalEnd } = parametersResponse
      const journalStartDateTime = `${ currentDate } ${ journalStart }`
      const journalEndDateTime = `${ currentDate } ${ journalEnd }`
      
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()
      
      if(
        this.dayjsAdapter.dateIsBefore(currentDateTime, journalStartDateTime) 
        || this.dayjsAdapter.dateIsAfter(currentDateTime, journalEndDateTime)
      ) {
        throw new ConflictException(error.CANT_REGISTER_CONTRACT_AT_THIS_TIME)
      }

      const { role }= userRequest
      const { name } = role

      if(
        !role 
        || (
          type === 'final' 
          && !['root', 'admin', 'companyOwner', 'companyAdministrator'].includes(name)
        )
      ) {
        throw new ConflictException(error.USER_DOESNT_HAVE_PERMISSIONS)
      }

      // const isWorker = ['companyWorker'].includes(name)

      let createdImage = null
      if(createImageDto) {
        createdImage = await this.imagesService.create(createImageDto, userRequest, clientIp);
      }

      const createdMovement = await this.movementModel.create({
        movementNumber: this.dayjsAdapter.getUnixTimestamp(),
        createdBy: userRequest.id,
        validatedBy: userRequest.id, // isWorker && type === 'out' ? null : userRequest.id,
        company: companyResponse.id,
        paymentPicture: createdImage?.id || null,
        amount,
        type,
        description: `[Movimiento de trabajador] - ${ description }`,
        status: 'validated', // isWorker && type === 'out' ? 'pending' : 'validated',
        movementDate: this.dayjsAdapter.getCurrentDate(),
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      await this.trackModel.create({
        ip: clientIp,
        description: `Movement ${ createdMovement.id } was created: ${ amount} (${ type }) .`,
        module: 'Movements',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })

      return createdMovement;

    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public pending = async (
    paginationDto: any = {},
    userRequest: User,
    company: string,
  ) => {
    try {

      const [
        companyResponse,
      ] = await Promise.all([
        this.companyModel.findById(company),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const isAdmin = ['companyOwner', 'companyAdmin', 'companySupervisor',].includes(userRequest?.role?.name)

      const { limit = 10000, offset = 0, filter = '', type } = paginationDto && !this.utils.isEmptyObject(paginationDto) 
        ? JSON.parse(paginationDto) 
        : { limit: 10000, offset: 0, filter: '', type: '' };
    
      const query = this.buildQuery(filter, companyResponse.id, isAdmin ? null : userRequest )
      const options = this.buildOptions(offset, limit)

      const pendingResponse = await this.movementModel.paginate(query, options)
      const { pagination, docs } = pendingResponse

      const todayPendingAmount = docs.reduce((amount, mov) => amount + mov.amount, 0)
      const bankAmount = docs.filter((mov) => mov.paymentType === 'bank').reduce((amount, mov) => amount + mov.amount, 0)
      const cashAmount = docs.filter((mov) => mov.paymentType === 'cash').reduce((amount, mov) => amount + mov.amount, 0)

      return {
        data: {
          pagination,
          movements: docs.map((mov) => this.formatReturnData(mov)),
          todayPendingAmount,
          bankAmount,
          cashAmount,
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

   public validateMovement= async (
    movement: Movement,
    company: string,
    userRequest: User,
    clientIp: string,
  ) => {

    try {

      const { id } = movement

      const [
        movementResponse,
        companyResponse,
        parametersResponse,
      ] = await Promise.all([
        this.movementModel.findById(id).populate({
          path: 'contract',
          populate: { path: 'client route createdBy paymentList movementList contractPending' },
        }),
        this.companyModel.findById(company),
        this.parameterModel.findOne({ company }),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      if(!movementResponse) {
        throw new NotFoundException(error.MOVEMENT_NOT_FOUND)
      }

      const currentDate = this.dayjsAdapter.getCurrentDate()
      const { journalStart, journalEnd } = parametersResponse
      const journalStartDateTime = `${ currentDate } ${ journalStart }`
      const journalEndDateTime = `${ currentDate } ${ journalEnd }`
      
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()
      
      if(
        this.dayjsAdapter.dateIsBefore(currentDateTime, journalStartDateTime) 
        || this.dayjsAdapter.dateIsAfter(currentDateTime, journalEndDateTime)
      ) {
        throw new ConflictException(error.CANT_REGISTER_CONTRACT_AT_THIS_TIME)
      }

      const { contract, amount, type } = movementResponse
      
      movementResponse.amount = amount
      movementResponse.status = 'validated'
      movementResponse.validatedBy = userRequest.id
      movementResponse.updatedAt = this.dayjsAdapter.getCurrentDateTime()

      await movementResponse.save()

      const bulkOperations = this.contractUtils.recalculateContracts(contract)

      if(bulkOperations.length) {
        await this.paymentModel.bulkWrite(bulkOperations)
      }
      const contractForUpdate = await this.contractModel.findById(contract.id).populate('contractPending paymentList movementList')
      const contractPendingUpdated = this.contractUtils.updatePendingModel(contractForUpdate)

      const { pendingAmount, isOutdated, isClientUpdatedForOutdated } = contractPendingUpdated

      if (pendingAmount === 0) {
        contractForUpdate.isActive = false
        contractPendingUpdated.isActive = false
      }

      if(isOutdated && !isClientUpdatedForOutdated) {

        const { client } = contract
        const { userData } = client

        if(userData.points > 0) {
          
          userData.points -= 1
          
          await Promise.all([
            userData.save(),
            this.trackModel.create({
              ip: clientIp,
              description: `Contract ${ contract.id } is outdated and the client ${ this.utils.getFullnameFromUser(client) } was subtracted 1 point.`,
              module: 'Contracts',
              createdAt: this.dayjsAdapter.getCurrentDateTime(),
              user: userRequest.id
            })
          ])
        }

        contractPendingUpdated.isClientUpdatedForOutdated = true
      }

      if(movementResponse?.description?.includes('[Nuevo contrato]')) {
        contractForUpdate.isActive = true
        contractForUpdate.isValidated = true
        contractPendingUpdated.isActive = true
      }

      await Promise.all([
        contractForUpdate.save(),
        contractPendingUpdated.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Movement ${ movementResponse.id } was validated by ${ userRequest.email }: ${ amount} (${ type }).`,
          module: 'Movements',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

      return { data: 'ok' }

    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public cancelMovement= async (
    movement: Movement,
    company: string,
    userRequest: User,
    clientIp: string,
  ) => {

    try {
      const { id } = movement
  
      const [
        movementResponse,
        companyResponse,
        parametersResponse,
      ] = await Promise.all([
        this.movementModel.findById(id).populate({
          path: 'contract',
          populate: { path: 'client route createdBy paymentList movementList contractPending' },
        })
        .populate('paymentPicture'),
        this.companyModel.findById(company),
        this.parameterModel.findOne({ company }),
      ])
  
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
  
      if(!movementResponse) {
        throw new NotFoundException(error.MOVEMENT_NOT_FOUND)
      }
  
      const currentDate = this.dayjsAdapter.getCurrentDate()
      const { journalStart, journalEnd } = parametersResponse
      const journalStartDateTime = `${ currentDate } ${ journalStart }`
      const journalEndDateTime = `${ currentDate } ${ journalEnd }`
      
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()
      
      if(
        this.dayjsAdapter.dateIsBefore(currentDateTime, journalStartDateTime) 
        || this.dayjsAdapter.dateIsAfter(currentDateTime, journalEndDateTime)
      ) {
        throw new ConflictException(error.CANT_REGISTER_CONTRACT_AT_THIS_TIME)
      }
  
      const { contract, amount, paymentPicture, type } = movementResponse
  
      if(paymentPicture) {
        await Promise.all([
          this.cloudAdapter.deleteResource(paymentPicture.publicId),
          paymentPicture.deleteOne(),
        ])
      }
  
      await movementResponse.deleteOne()
  
      if(contract) {
        const bulkOperations = this.contractUtils.recalculateContracts(contract)

        // ESTO SE REPITE EN CONTRACTS SERVICE Y PAYMENTS SERVICE
    
        if(bulkOperations.length) {
          await this.paymentModel.bulkWrite(bulkOperations)
        }
        const contractForUpdate = await this.contractModel.findById(contract.id).populate('contractPending paymentList movementList')
        const contractPendingUpdated = this.contractUtils.updatePendingModel(contractForUpdate)

        const { pendingAmount, isOutdated, isClientUpdatedForOutdated } = contractPendingUpdated

        if (pendingAmount === 0) {
          contractForUpdate.isActive = false
          contractPendingUpdated.isActive = false
          contractForUpdate.finishedAt = this.dayjsAdapter.getCurrentDateTime()
        }

        if(isOutdated && !isClientUpdatedForOutdated) {

          const { client } = contract
          const { userData } = client

          if(userData.points > 0) {
            
            userData.points -= 1
            
            await Promise.all([
              userData.save(),
              this.trackModel.create({
                ip: clientIp,
                description: `Contract ${ contract.id } is outdated and the client ${ this.utils.getFullnameFromUser(client) } was subtracted 1 point.`,
                module: 'Contracts',
                createdAt: this.dayjsAdapter.getCurrentDateTime(),
                user: userRequest.id
              })
            ])
          }

          contractPendingUpdated.isClientUpdatedForOutdated = true
        }

        if(movementResponse?.description?.includes('[Nuevo contrato]')) {
          contractForUpdate.isActive = false
          contractForUpdate.isValidated = false
          contractPendingUpdated.isActive = false
        }
    
        await Promise.all([
          contractForUpdate.save(),
          contractPendingUpdated.save(),
          this.trackModel.create({
            ip: clientIp,
            description: `Movement ${ movementResponse.id } was cancelled by ${ userRequest.email }: ${ amount} (${ type }).`,
            module: 'Movements',
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            user: userRequest.id
          })
        ])
      }
  
      return { data: 'ok' }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }

  }

  public getResume = async ({ selectedCompany, selectedWorker, selectedRoute }, userRequest: User, isDashboard = false) => {
    try {
      const currentDate = this.dayjsAdapter.getCurrentDate()
  
      const [
        companyResponse,
        workerResponse,
        routeResponse,
        movementsResponse,
        contractsResponse,
      ] = await Promise.all([
        this.companyModel.findById(selectedCompany),
        selectedWorker !== 'general' ? this.userModel.findById(selectedWorker) : null,
        selectedRoute !== 'general' ? this.routeModel.findById(selectedRoute) : null,
        this.movementModel.find({ company: selectedCompany, movementDate: currentDate })
          .populate({
            path: 'contract',
            populate: {
              path: 'createdBy',
              select: 'firstName paternalSurname',
            },
            select: 'createdBy',
            transform: (contract) => {
              return {
                createdBy: `${ contract.createdBy.firstName } ${ contract.createdBy.paternalSurname }`
              }
            }
          })
          .populate({
            path: 'createdBy',
            transform: (createdBy) => {
              return `${ createdBy.firstName } ${ createdBy.paternalSurname }`
            }
          })
          .select('type description status amount paymentType'),
        this.contractModel.find({
          isActive: true, 
          company: selectedCompany, 
          worker: selectedWorker !== 'general'
            ? selectedWorker
            : { $exists: true },
          route: selectedRoute !== 'general'
            ? selectedRoute
            : { $exists: true },
        }).populate({
          path: 'paymentList',
          match: {
            paymentDate: currentDate
          },
          select: 'paymentAmount isComplete'
        }).populate('contractPending')
        // .select('createdAt loanAmount lastContractDate paymentList'),
      ])
  
      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      if(selectedWorker !== 'general' && !workerResponse) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }
      
      if(selectedRoute !== 'general' && !routeResponse) {
        throw new NotFoundException(error.ROUTE_NOT_FOUND)
      }
      
      const movementStats = movementsResponse.reduce(
        (acc, mov) => {
          if (mov.type === 'out') {
            if (mov.status === 'validated') acc.validOut.push(mov); // Guarda el movimiento completo
            if (!mov.description.includes('[Nuevo contrato]')) acc.expense.push(mov); // Guarda el gasto completo
          } else if (mov.type === 'in') {
            if (mov.status === 'validated') acc.validIn.push(mov); // Guarda el movimiento completo
            if (mov.description.includes('[Abono]')) {
              acc.collectedIn.push(mov); // Guarda el abono completo
              if (mov.paymentType === 'cash') acc.cash += mov.amount;
              if (mov.paymentType === 'bank') acc.bank += mov.amount;
            } else {
              acc.income.push(mov); // Guarda el ingreso completo
            }
          }
          return acc;
        },
        { validOut: [], validIn: [], collectedIn: [], expense: [], income: [], cash: 0, bank: 0 }
      );
      // console.log("🚀 ~ MovementsService ~ getResume= ~ movementStats:", movementStats)

      const contractStats = contractsResponse.reduce(
        (acc, contract) => {
          if (contract.createdAt.includes(currentDate)) {
            acc.createdToday++;
            acc.amountToday += contract.loanAmount || 0;
            if (contract.lastContractDate) acc.regularToday++;
          }

          const contractLate = !contract.contractPending.isOutdated && contract.contractPending.paymentsLate > 0;
          const contractExpired = contract.contractPending.isOutdated;
          // console.log("🚀 ~ MovementsService ~ getResume= ~ contract.contractPending:", contract)
    
          acc.collectedPayments += contract.paymentList.filter(p => p.isComplete).length;
          acc.uncollectedPayments += contract.paymentList.filter(p => !p.isComplete).length;
          acc.totalAmountToCollect += contract.paymentList.reduce((sum, p) => sum + p.paymentAmount, 0);
          acc.totalAmountToCollectLate += contractLate ? 
          contract.contractPending.paymentAmount // (contract.contractPending.paymentsLate * contract.contractPending.paymentAmount) 
            : 0;
          acc.totalAmountToCollectExpired += contractExpired ? 
            contract.contractPending.paymentAmount // (contract.contractPending.pendingAmount - contract.contractPending.notValidatedAmount) 
            : 0;
          acc.totalPayments += contractLate ? 1 : 0;
          acc.totalPayments += contractExpired ? 1 : 0;
          return acc;
        },
        { createdToday: 0, amountToday: 0, regularToday: 0, totalPayments: 0, collectedPayments: 0, uncollectedPayments: 0, totalAmountToCollect: 0, totalAmountToCollectLate: 0, totalAmountToCollectExpired: 0 }
      );
      // console.log("🚀 ~ MovementsService ~ getResume= ~ contractsResponse:", contractsResponse)
      // console.log("🚀 ~ MovementsService ~ getResume= ~ contractStats:", contractStats)


      const resumeData = {
        totalActiveContracts: contractsResponse.length,
        totalActiveContractsFromYesterday: (contractsResponse.length - contractStats.createdToday), // Esto debe salir del cierre diario anterior
        totalMovements: movementsResponse.length,
        movementsFromToday: isDashboard ? {} : {
          incomesMovementsFromToday: movementStats.validIn,
          expensesMovementsFromToday: movementStats.validOut,
        },
        amountToBeCollected: contractStats.totalAmountToCollect,
        amountToBeCollectedLate: contractStats.totalAmountToCollectLate,
        amountToBeCollectedExpired: contractStats.totalAmountToCollectExpired,
        beforeAmount: 0, // TODO Falta DailyResume model
        paymentsToBeCollected: contractStats.totalPayments,
        regularContractsFromToday: contractStats.regularToday,
        amountContractsFromToday: contractStats.amountToday,
        contractsFromToday: contractStats.createdToday,
        movementsCollected: movementStats.collectedIn.length,
        paymentsCollectedComplete: contractStats.collectedPayments,
        paymentsCollectedIncomplete: contractStats.uncollectedPayments,
        amountCollected: movementStats.collectedIn.reduce((amount, mov) => amount + mov.amount, 0),
        expensesAmount: movementStats.expense.reduce((amount, mov) => amount + mov.amount, 0),
        incomesAmount: movementStats.income.reduce((amount, mov) => amount + mov.amount, 0),
        todayAmount: movementStats.validIn.reduce((amount, mov) => amount + mov.amount, 0),
        todayCash: movementStats.cash,
        todayBank: movementStats.bank,
      };

      return {
        data: { ...resumeData }
      }
      
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
