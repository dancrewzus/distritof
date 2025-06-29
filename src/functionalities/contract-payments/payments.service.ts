import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { Notification } from 'src/functionalities/notifications/entities/notification.entity'
import { NotificationUser } from '../notifications/entities/user-notification.entity'
import { Parameter } from 'src/functionalities/parameters/entities/parameter.entity'
import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { ImagesService } from 'src/functionalities/images/images.service'
import { Track } from 'src/functionalities/tracks/entities/track.entity'
import { User } from 'src/functionalities/users/entities/user.entity'
import { Geolocation } from '../users/entities/geolocation.entity'
import { UserCompany } from '../users/entities/userCompany.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { ContractUtils } from '../contracts/utils/contract.utils'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Movement } from '../movements/entities/movement.entity'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { error } from 'src/common/constants/error-messages'
import { ContractPayment } from './entities/payment.entity'
import { Role } from '../roles/entities/role.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class PaymentsService {

  private defaultLimit: number;

  constructor(
    @InjectModel(NotificationUser.name, 'default') private readonly notificationUserModel: Model<NotificationUser>,
    @InjectModel(ContractPayment.name, 'default') private readonly paymentModel: Model<ContractPayment>,
    @InjectModel(Notification.name, 'default') private readonly notificationModel: Model<Notification>,
    @InjectModel(Geolocation.name, 'default') private readonly geolocationModel: Model<Geolocation>,
    @InjectModel(UserCompany.name, 'default') private readonly userCompanyModel: Model<UserCompany>,
    @InjectModel(Parameter.name, 'default') private readonly parameterModel: Model<Parameter>,
    @InjectModel(Contract.name, 'default') private readonly contractModel: Model<Contract>,
    @InjectModel(Movement.name, 'default') private readonly movementModel: Model<Movement>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(User.name, 'default') private readonly userModel: Model<User>,
    @InjectModel(Role.name, 'default') private readonly roleModel: Model<Role>,
    private readonly configService: ConfigService,
    private readonly imagesService: ImagesService,
    private readonly contractUtils: ContractUtils,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
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
   * Creates a new payment. This method takes a DTO for creating a payment, the user requesting the
   * creation, and the client's IP address. It saves the new payment in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreatePaymentDto} createPaymentsDto - Data Transfer Object containing details for the new payment.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created payment.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createPaymentsDto: CreatePaymentDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      
      const {
        amount,
        createImageDto,
        paymentType,
        contract,
        geolocation,
        company,
      } = createPaymentsDto

      const [
        contractResponse,
        companyResponse,
        parametersResponse,
      ] = await Promise.all([
        this.contractModel.findById(contract)
          .populate('route createdBy paymentList movementList contractPending')
          .populate({
            path: 'client',
            populate: {
              path: 'userData',
            },
          }),
        this.companyModel.findById(company),
        this.parameterModel.findOne({ company }),
      ])

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      
      if(!contractResponse) {
        throw new NotFoundException(error.CONTRACT_NOT_FOUND)
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
        throw new ConflictException(error.CANT_REGISTER_PAYMENTS_AT_THIS_TIME)
      }

      // Validate if the payment is already registered
      const { client, route, movementList, contractPending, contractNumber } = contractResponse
      
      const movementExist = movementList.filter((mov) => mov.movementDate === currentDate && mov.type === 'in' && mov.paymentType === paymentType)
      
      if(movementExist.length) {
        const { createdAt } = movementExist[movementExist.length - 1]
        const nextMovementDay = this.dayjsAdapter.sumMinutesToDate(createdAt, 2)
        
        if (this.dayjsAdapter.currentDateTimeIsBeforeOfDateTime(nextMovementDay)) {
          throw {
            code: 3000,
            message: `El movimiento ya fue ingresado, verifique los movimientos del cliente`,
          }
        }
      }

      // Validate if the payment is greater than the contract amount
      const { notValidatedAmount, payedAmount, totalAmount } = contractPending
      if((payedAmount + notValidatedAmount + amount) > totalAmount) {
        throw {
          code: 3001,
          message: `El monto ingresado supera el monto pendiente del contrato, verifique e intente nuevamente.`,
        }
      }

      let createdImage = null
      if(createImageDto) {
        createdImage = await this.imagesService.create(createImageDto, userRequest, clientIp);
      }

      const clientFullName = this.utils.getFullnameFromUser(client)
      const movementNumber = this.dayjsAdapter.getUnixTimestamp()
      const isNotClient = userRequest.role.name != 'companyClient'

      const createdMovement = await this.movementModel.create({
        movementNumber,
        createdBy: userRequest.id,
        validatedBy: isNotClient ? userRequest.id : null,
        contract: contractResponse?.id,
        route: route?.id,
        company: companyResponse.id,
        paymentPicture: createdImage?.id || null,
        amount,
        type: 'in',
        description: `[Abono]: ${ clientFullName }`,
        status: isNotClient ? 'validated' : 'pending',
        paymentType,
        comment: `[Abono]: ${ clientFullName }`,
        movementDate: currentDate,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      contractResponse.movementList.push(createdMovement)

      if(geolocation && geolocation.latitude !== 0 && geolocation.longitude !== 0) {
        const userLocation = await this.geolocationModel.findOne({ client: client.id })
        if(!userLocation) {
          await this.geolocationModel.create({
            client: client.id,
            latitude: geolocation.latitude,
            longitude: geolocation.longitude,
            createdAt: this.dayjsAdapter.getCurrentDateTime(),
            updatedAt: this.dayjsAdapter.getCurrentDateTime(),
          })
        } else {
          await this.geolocationModel.updateOne(
            { client: client.id },
            {
              latitude: geolocation.latitude,
              longitude: geolocation.longitude,
              updatedAt: this.dayjsAdapter.getCurrentDateTime(),
            }
          )
        }
      }

      await Promise.all([
        contractResponse.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Contract movement ${ movementNumber } was created: ${ amount } - ${ clientFullName }.`,
          module: 'Payments',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        }),
        !isNotClient ? this.createNotifications({
          title: 'Se ha generado un abono',
          description: `El cliente ${ clientFullName } ha generado un abono por ${ amount }, en el contrato ${ contractNumber }, por favor verificarlo.`,
          type: 'payment',
        }, companyResponse) : null
      ])

      const bulkOperations = this.contractUtils.recalculateContracts(contractResponse)

      // ESTO SE REPITE EN CONTRACTS SERVICE Y MOVEMENTS SERVICE
      
      if(bulkOperations.length) {
        await this.paymentModel.bulkWrite(bulkOperations)
      }
      const contractForUpdate = await this.contractModel.findById(contract).populate('contractPending paymentList movementList')
      const contractPendingUpdated = this.contractUtils.updatePendingModel(contractForUpdate)
      const { pendingAmount, isOutdated, isClientUpdatedForOutdated } = contractPendingUpdated

      if (pendingAmount === 0) {
        contractForUpdate.isActive = false
        contractPendingUpdated.isActive = false
        contractForUpdate.finishedAt = this.dayjsAdapter.getCurrentDateTime()
      }

      if(isOutdated && !isClientUpdatedForOutdated) {

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
}
