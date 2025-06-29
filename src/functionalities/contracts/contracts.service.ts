import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions, isObjectIdOrHexString } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { PaymentModality } from 'src/functionalities/modalities/entities/payment-modality.entity'
import { Notification } from 'src/functionalities/notifications/entities/notification.entity'
import { NotificationUser } from '../notifications/entities/user-notification.entity'
import { Parameter } from 'src/functionalities/parameters/entities/parameter.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Holiday } from 'src/functionalities/holidays/entities/holiday.entity'
import { ContractPayment } from '../contract-payments/entities/payment.entity'
import { ContractPending } from '../contract-pending/entities/pending.entity'
import { ImagesService } from 'src/functionalities/images/images.service'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { Track } from 'src/functionalities/tracks/entities/track.entity'
import { User } from 'src/functionalities/users/entities/user.entity'
import { ContractNote } from '../contract-notes/entities/note.entity'
import { UserCompany } from '../users/entities/userCompany.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { CloudAdapter } from 'src/common/adapters/cloud.adapter'
import { Movement } from '../movements/entities/movement.entity'
import { colors } from 'src/common/constants/colors.constants'
import { CreateContractDto } from './dto/create-contract.dto'
import { error } from 'src/common/constants/error-messages'
import { Image } from '../images/entities/image.entity'
import { ContractUtils } from './utils/contract.utils'
import { Contract } from './entities/contracts.entity'
import { Role } from '../roles/entities/role.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class ContractsService {
  
  private defaultLimit: number;
  
  constructor(
    @InjectModel(ContractPending.name, 'default') private readonly pendingModel: PaginateModel<ContractPending>,
    @InjectModel(NotificationUser.name, 'default') private readonly notificationUserModel: Model<NotificationUser>,
    @InjectModel(PaymentModality.name, 'default') private readonly modalityModel: Model<PaymentModality>,
    @InjectModel(ContractPayment.name, 'default') private readonly paymentModel: Model<ContractPayment>,
    @InjectModel(Notification.name, 'default') private readonly notificationModel: Model<Notification>,
    @InjectModel(UserCompany.name, 'default') private readonly userCompanyModel: Model<UserCompany>,
    @InjectModel(Contract.name, 'default') private readonly contractModel: PaginateModel<Contract>,
    @InjectModel(ContractNote.name, 'default') private readonly noteModel: Model<ContractNote>,
    @InjectModel(Parameter.name, 'default') private readonly parameterModel: Model<Parameter>,
    @InjectModel(Movement.name, 'default') private readonly movementModel: Model<Movement>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Holiday.name, 'default') private readonly holidayModel: Model<Holiday>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(Route.name, 'default') private readonly routeModel: Model<Route>,
    @InjectModel(User.name, 'default') private readonly userModel: Model<User>,
    @InjectModel(Role.name, 'default') private readonly roleModel: Model<Role>,
    private readonly imagesService: ImagesService,
    private readonly configService: ConfigService,
    private readonly contractUtils: ContractUtils,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly cloudAdapter: CloudAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, companyId: string, userRequest: User): any {
    const baseQuery = {
      company: companyId,
      isValidated: false,
      deleted: false,
    }
    
    const isSearch = filter !== '' ? true : false

    if (isSearch) {
      return {
        ...baseQuery,
        $or: [
          { contractNumber: new RegExp(filter, 'i') },
          { loanAmount: new RegExp(filter, 'i') },
          { totalAmount: new RegExp(filter, 'i') },
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
          path: 'route client createdBy worker productPicture notes modality'
        },
      ]
    };
    return options;
  }

  private createNotifications = async (notificationData: any, companyResponse: Company) => {

    const currentDateTime = this.dayjsAdapter.getCurrentDateTime();
    const companyId = companyResponse.id;

    // Obtener los IDs de roles relevantes
    const roleNames = ['companyOwner', 'companyAdmin', 'companySupervisor'];
    const roles = await this.roleModel.find({ name: { $in: roleNames } });

    const roleMap = new Map<string, string>();
    roles.forEach(role => roleMap.set(role.name, role.id));

    // Obtener relaciones activas entre usuarios y la empresa
    const userCompanies = await this.userCompanyModel.find({
      company: companyId,
      isActive: true,
      deleted: false,
    });

    const userIds = userCompanies.map(uc => uc.user);

    // Buscar usuarios con los roles relevantes y cargar el nombre del rol
    const users = await this.userModel.find({
      _id: { $in: userIds },
      role: { $in: Array.from(roleMap.values()) },
    }).populate('role');

    // Crear notificación base
    const { type, title, description } = notificationData;
    const createdNotification = await this.notificationModel.create({
      type,
      title,
      description,
      isChecked: false,
      createdAt: currentDateTime,
      updatedAt: currentDateTime,
    });

    // Crear notificación por usuario en paralelo
    const notificationUsers = users.map(user => ({
      isChecked: false,
      notification: createdNotification.id,
      user: user.id,
      role: user.role?.name || '',
      createdAt: currentDateTime,
      updatedAt: currentDateTime,
    }));

    await this.notificationUserModel.insertMany(notificationUsers);

    return;
  }

  /**
   * Creates a new contract. This method takes a DTO for creating a contract, the user requesting the
   * creation, and the client's IP address. It saves the new contract in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateContractDto} createContractDto - Data Transfer Object containing details for the new contract.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created contract.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createContractDto: CreateContractDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {

      const { 
        route,
        company,
        client,
        worker,
        createImageDto,
        modality,
        lastContractDate,
        loanAmount,
        percent,
        paymentsQuantity,
        totalAmount,
        paymentAmount,
      } = createContractDto
      let { nonWorkingDays } = createContractDto

      const [
        companyResponse,
        routeResponse,
        clientResponse,
        workerResponse,
        modalityResponse,
        parametersResponse,
        holidaysResponse,
      ] = await Promise.all([
        this.companyModel.findById(company),
        this.routeModel.findById(route),
        this.userModel.findById(client),
        this.userModel.findById(worker),
        this.modalityModel.findById(modality),
        this.parameterModel.findOne({ company }),
        this.holidayModel.find({ company, isActive: true, deleted: false })
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      if(!routeResponse) {
        throw new NotFoundException(error.CITY_NOT_FOUND)
      }

      if(!clientResponse) {
        throw new NotFoundException(error.CLIENT_NOT_FOUND)
      }

      if(!workerResponse) {
        throw new NotFoundException(error.WORKER_NOT_FOUND)
      }

      if(!modalityResponse) {
        throw new NotFoundException(error.PAYMENT_MODALITY_NOT_FOUND)
      }

      if(!parametersResponse) {
        throw new NotFoundException(error.PARAMETER_NOT_FOUND)
      }
      
      const currentDate = this.dayjsAdapter.getCurrentDate()
      const { journalStart, journalEnd, allowsSimultaneousCreditsForClient } = parametersResponse
      const journalStartDateTime = `${ currentDate } ${ journalStart }`
      const journalEndDateTime = `${ currentDate } ${ journalEnd }`
      
      const currentDateTime = this.dayjsAdapter.getCurrentDateTime()
      
      if(
        this.dayjsAdapter.dateIsBefore(currentDateTime, journalStartDateTime) 
        || this.dayjsAdapter.dateIsAfter(currentDateTime, journalEndDateTime)
      ) {
        throw new ConflictException(error.CANT_REGISTER_CONTRACT_AT_THIS_TIME)
      }
    
      const activeContracts = await this.contractModel.find({ client: clientResponse._id, isActive: true })

      if(activeContracts.length && !allowsSimultaneousCreditsForClient) {
        throw new ConflictException(error.CLIENT_HAVE_ACTIVE_CONTRACT)
      }

      if(modalityResponse.type === 'weekly' && nonWorkingDays.length > 3) {
        for (let index = 0; index < 7; index++) {
          const day = this.utils.parseDay(index)
          if(!nonWorkingDays.includes(day)) {
            nonWorkingDays = day
            break;
          }
        }
      }

      const holidaysDates = holidaysResponse.map((date) => date.holidayDate)

      const paymentDays = this.contractUtils.setPaymentDays({
        currentDate,
        holidaysDates,
        paymentsQuantity,
        nonWorkingDays,
        modality: modalityResponse.type,
      })

      const createdImage = await this.imagesService.create(createImageDto, userRequest, clientIp)

      const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name)
      
      const createdContract = await this.contractModel.create({
        isValidated: isAdmin ? true : false,
        contractNumber: this.dayjsAdapter.getUnixTimestamp(),
        route: routeResponse.id,
        company: companyResponse.id,
        client: clientResponse.id,
        createdBy: userRequest.id,
        worker: workerResponse.id,
        productPicture: createdImage?.id,
        contractStatus: null,
        modality: modalityResponse.id,
        notes: [],
        paymentList: [],
        lastContractDate,
        loanAmount,
        percent,
        paymentsQuantity,
        totalAmount,
        paymentAmount,
        paymentDays,
        nonWorkingDays,
        validatedBy: isAdmin ? userRequest.id : null,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      });

      const paymentList = []

      for (let index = 0; index < paymentDays.length; index++) {
        const dateString = paymentDays[index];
        paymentList.push({
          createdBy: userRequest.id,
          client: clientResponse.id,
          contract: createdContract.id,
          payedAmount: 0,
          paymentAmount,
          paymentNumber: index + 1,
          isComplete: false,
          movements: [],
          paymentDate: dateString,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        })
      }

      const clientFullName = this.utils.getFullnameFromUser(clientResponse)

      const [
        createdPendingContract,
        createdMovement,
        createdPayments,
        createdNotifications,
      ] = await Promise.all([
        this.pendingModel.create({
          contract: createdContract.id,
          worker: workerResponse.id,
          client: clientResponse.id,
          route: routeResponse.id,
          company: companyResponse.id,
          clientName: clientFullName,
          loanAmount,
          totalAmount,
          payedAmount: 0,
          notValidatedAmount: 0,
          pendingAmount: totalAmount,
          paymentAmount: paymentAmount,
          amountLateOrIncomplete: 0,
          paymentsLate: 0,
          paymentsUpToDate: 0,
          paymentsIncomplete: 0,
          paymentsRemaining: paymentsQuantity,
          daysExpired: 0,
          daysAhead: 0,
          icon: 'check',
          color: 'green',
          todayIncomplete: false,
          daysPending: 0,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
        this.movementModel.create({
          movementNumber: this.dayjsAdapter.getUnixTimestamp(),
          createdBy: userRequest.id,
          validatedBy: isAdmin ? userRequest.id : null,
          contract: createdContract.id,
          route: routeResponse.id,
          company: companyResponse.id,
          paymentPicture: null,
          amount: loanAmount,
          type: 'out',
          description: `[Nuevo contrato]: ${ clientFullName }`,
          status: isAdmin ? 'validated' : 'pending',
          paymentType: 'cash',
          comment: '',
          movementDate: this.dayjsAdapter.getCurrentDate(),
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
        this.paymentModel.insertMany(paymentList),
        this.createNotifications({
          title: 'Se ha creado un nuevo contrato',
          description: `Se ha creado un nuevo contrato al cliente ${ clientFullName }, por favor verificarlo.`,
          type: 'contract',
        }, companyResponse)
      ])

      createdContract.movementList.push(createdMovement.id)
      createdContract.paymentList = createdPayments.map((payment) => payment.id)
      createdContract.contractPending = createdPendingContract.id

      await Promise.all([
        createdContract.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Contract ${ createdContract.id } was created: ${ totalAmount } (${ clientFullName }).`,
          module: 'Contracts',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        }),
      ])
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * 
   * @param clientId 
   * @param companyId 
   * @returns 
   */
  public findContract = async (
    clientId: string,
    companyId: string
  ) => {
    try {

      if(!isObjectIdOrHexString(companyId)) {
        const companyResponse = await this.companyModel.findOne({ name: companyId })
        if(!companyResponse) {
          throw new NotFoundException(error.COMPANY_NOT_FOUND)
        }
        companyId = companyResponse.id
      }

      const calendarEvents: any[] = []

      const [
        companyResponse,
        contractResponse,
        contractsQuantity,
      ] = await Promise.all([
        this.companyModel.findById(companyId),
        this.contractModel
          .findOne({ client: clientId, isActive: true, company: companyId })
          .populate('createdBy productPicture modality route')
          .populate({
            path: 'notes',
            populate: { path: 'createdBy' }
          })
          .populate({
            path: 'paymentList',
            populate: { 
              path: 'movements',
              populate: { path: 'paymentPicture' }
            }
          })
          .populate({
            path: 'contractPending',
            populate: { 
              path: 'contract',
              populate: [
                { path: 'modality' },
                { 
                  path: 'notes',
                  populate: { path: 'createdBy' }
                },
              ]
            }
          })
          .populate({
            path: 'movementList',
            populate: { path: 'paymentPicture' }
          }),
        this.contractModel.find({ client: clientId, company: companyId }).countDocuments()
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      if(!contractResponse) {
        return {
          data: {
            haveActiveContracts: false,
            contract: null,
            calendarEvents,
            patchValue: {
              contractsQuantity,
            }
          }
        }
      }

      const {
        createdAt,
        paymentAmount,
        paymentList,
        paymentDays,
        movementList,
        contractPending,
      } = contractResponse;
      const { pendingAmount } = contractPending;

      if (pendingAmount === 0) {
        contractResponse.isActive = false
        contractPending.isActive = false

        await Promise.all([
          contractResponse.save(),
          contractPending.save(),
        ])

        return {
          data: {
            haveActiveContracts: false,
            contract: null,
            calendarEvents,
            patchValue: {
              contractsQuantity,
            }
          }
        }
      }
      
      const today = this.dayjsAdapter.getCurrentDate()
      const contractEndDate = paymentDays[paymentDays.length - 1]

      let paymentClientNumber = 0
      let paymentClientAmount = 0
      let mustTodayPayed = 0
      let daysAhead = 0
      let daysLate = 0
      let daysExpired = 0
      
      const contractCreatedDate = this.dayjsAdapter.getFormattedDateFromDateTime(createdAt)
      const calendarInitDate = this.dayjsAdapter.changeDateFormatFromDate(contractCreatedDate) + 'T00:00:00'
      const haveMovementsInitDate = movementList?.filter((mov) => mov.movementDate === contractCreatedDate && mov.type === 'in') || []
      const totalPayedOnInitDate = haveMovementsInitDate && haveMovementsInitDate.length ? haveMovementsInitDate.reduce((amount, mov) => amount + mov.amount, 0) : 0
      const contractExpired = this.dayjsAdapter.dateIsAfter(today, contractEndDate, false)

      calendarEvents.push({
        start: calendarInitDate,
        backgroundColor: colors.CLIENT_RECEIVE_PAY,
        display: 'background',
        allDay: true,
        title: totalPayedOnInitDate > 0 ? this.utils.formatNumber(totalPayedOnInitDate) : ''
      })
  
      const paymentDatesSet = new Set(paymentList.map(p => p.paymentDate));

      paymentList.forEach((payment) => {

        const { paymentDate, isComplete, payedAmount, paymentNumber } = payment
        const movementsFromToday = movementList.filter((mov) => mov.movementDate === paymentDate)
        const totalPayedFromToday = movementsFromToday && movementsFromToday.length ? movementsFromToday.reduce((amount, mov) => amount + mov.amount, 0) : 0

        const isBefore = this.dayjsAdapter.dateIsBefore(paymentDate, today, false)
        const isToday = this.dayjsAdapter.dateIsSame(paymentDate, today)
        const isAhead = this.dayjsAdapter.dateIsAfter(paymentDate, today, false)

        let color = colors.PAY_DAY

        if(isBefore || isToday) {
          mustTodayPayed += paymentAmount
        }

        if((isBefore || isToday) && payedAmount === 0) {
          color = colors.NOT_PAYED
          daysLate++
        }

        if(isComplete) {
          color = colors.PAYED
        }

        if(!isComplete && payedAmount > 0) {
          color = colors.PENDING
          paymentClientNumber = paymentNumber
          paymentClientAmount = this.utils.roundDecimals(paymentAmount - payedAmount)
        }

        if(isAhead && payedAmount > 0) {
          color = colors.PAYED
          daysAhead++
        }
        
        const calendarDate = this.dayjsAdapter.changeDateFormatFromDate(paymentDate) + 'T00:00:00'
        calendarEvents.push({
          start: calendarDate,
          backgroundColor: color,
          display: 'background',
          allDay: true,
          title: totalPayedFromToday > 0 ? this.utils.formatNumber(totalPayedFromToday) : ''
        })
      });

      // Días vencidos con deuda
      if(contractExpired && pendingAmount > 0) {
        daysExpired = this.dayjsAdapter.dateDifference(today, contractEndDate, 'days', false)
        
        for (let index = 1; index <= daysExpired; index++) {
          const date = this.dayjsAdapter.sumDaysToDate(contractEndDate, index)
          const calendarDate = this.dayjsAdapter.changeDateFormatFromDate(date) + 'T00:00:00'

          calendarEvents.push({
            start: calendarDate,
            backgroundColor: colors.DAY_EXPIRED,
            display: 'background',
            allDay: true,
            title: ''
          })
        }
      }

      // ✅ NUEVO: Movimientos fuera de paymentList agrupados por fecha
      const extraMovementsByDate = movementList.reduce((acc, mov) => {
        const movDate = mov.movementDate;
        const isInPaymentList = paymentDatesSet.has(movDate);
        const calendarDate = this.dayjsAdapter.changeDateFormatFromDate(movDate) + 'T00:00:00';
  
        if (!isInPaymentList && mov.type === 'in') {
          if (!acc[calendarDate]) {
            acc[calendarDate] = 0;
          }
          acc[calendarDate] += mov.amount;
        }
  
        return acc;
      }, {} as Record<string, number>);
  
      Object.entries(extraMovementsByDate).forEach(([calendarDate, totalAmount]) => {
        calendarEvents.push({
          start: calendarDate,
          backgroundColor: colors.PAYED,
          display: 'background',
          allDay: true,
          title: this.utils.formatNumber(totalAmount),
        });
      });

      return {
        data: {
          contract: this.contractUtils.formatReturnData(contractResponse),
          calendarEvents,
          patchValue: {
            lastContractDate: contractCreatedDate,
            paymentClientNumber,
            paymentClientAmount,
            contractsQuantity,
          }
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * 
   * @param contractId 
   * @param companyId 
   * @param userRequest 
   * @param clientIp 
   */
  public recalculateContract = async (
    contractId: string,
    companyId: string,
    userRequest: User,
    clientIp: string,
  ) => {

    try {

      const [
        companyResponse,
        contractResponse,
      ] = await Promise.all([
        this.companyModel.findById(companyId),
        this.contractModel
          .findById(contractId)
          .sort({ createdAt: 'asc' })
          .populate('paymentList movementList')
          .populate({
            path: 'client',
            populate: {
              path: 'userData',
            },
          }),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      if(!contractResponse) {
        throw new NotFoundException(error.CONTRACT_NOT_FOUND)
      }
      
      const bulkOperations = this.contractUtils.recalculateContracts(contractResponse)

      // ESTO SE REPITE EN PAYMENTS SERVICE Y MOVEMENTS SERVICE

      if(bulkOperations.length) {
        await this.paymentModel.bulkWrite(bulkOperations)
      }
      const contractForUpdate = await this.contractModel.findById(contractId).populate('contractPending paymentList movementList')
      const contractPendingUpdated = this.contractUtils.updatePendingModel(contractForUpdate)

      const { pendingAmount, isOutdated, isClientUpdatedForOutdated } = contractPendingUpdated

      if (pendingAmount === 0) {
        contractForUpdate.isActive = false
        contractPendingUpdated.isActive = false
        contractForUpdate.finishedAt = this.dayjsAdapter.getCurrentDateTime()
      }

      if(isOutdated && !isClientUpdatedForOutdated) {

        const { client } = contractResponse
        const { userData } = client

        if(userData.points > 0) {
          
          userData.points -= 1
          
          await Promise.all([
            userData.save(),
            this.trackModel.create({
              ip: clientIp,
              description: `Contract ${ contractResponse.id } is outdated and the client ${ this.utils.getFullnameFromUser(client) } was subtracted 1 point.`,
              module: 'Contracts',
              createdAt: this.dayjsAdapter.getCurrentDateTime(),
              user: userRequest.id
            })
          ])
        }

        contractPendingUpdated.isClientUpdatedForOutdated = true
      }
      
      await Promise.all([
        contractForUpdate.save(),
        contractPendingUpdated.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Contract ${ contractResponse.id } was recalculated.`,
          module: 'Contracts',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

      return

    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * 
   * @param id 
   * @param userRequest 
   * @returns 
   */
  public cancelContract = async (
    contractId: string, 
    userRequest: User,
    clientIp: string,
  ) => {
    try {

      const [
        contractResponse,
      ] = await Promise.all([
        this.contractModel
          .findById(contractId)
          .populate('productPicture contractPending')
          .populate({
            path: 'movementList',
            populate: { path: 'paymentPicture' }
          }),
      ])

      if(!contractResponse) {
        throw new NotFoundException(error.CONTRACT_NOT_FOUND)
      }

      const { productPicture, contractPending, movementList } = contractResponse

      for (let index = 0; index < movementList.length; index++) {
        const movement = movementList[index]
        const { paymentPicture } = movement
        if(paymentPicture) {
          await Promise.all([
            this.cloudAdapter.deleteResource(paymentPicture.publicId),
            paymentPicture.deleteOne(),
            movement.deleteOne(),
          ])
        } else {
          await movement.deleteOne()
        }
      }

      await Promise.all([
        this.cloudAdapter.deleteResource(productPicture.publicId),
        this.paymentModel.deleteMany({ contract: contractResponse.id }),
        this.noteModel.deleteMany({ contract: contractResponse.id }),
        contractPending?.deleteOne(),
        productPicture?.deleteOne(),
        contractResponse?.deleteOne(),
        this.trackModel.create({
          ip: clientIp,
          description: `Contract ${ contractResponse.id } was deleted.`,
          module: 'Contracts',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        }),
      ])
      
      return
    
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public pending = async (
    paginationDto: any = {},
    userRequest: User,
    companyId: string,
  ) => {
    try {

      const [
        companyResponse,
      ] = await Promise.all([
        this.companyModel.findById(companyId),
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

      const pendingResponse = await this.contractModel.paginate(query, options)
      const { pagination, docs } = pendingResponse

      const todayPendingAmount = docs.reduce((amount, contract) => amount + contract.loanAmount, 0)

      return {
        data: {
          pagination,
          contracts: docs.map((contract) => this.contractUtils.formatReturnData(contract)),
          todayPendingAmount,
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}