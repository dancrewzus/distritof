import { Injectable } from "@nestjs/common";
import { isObjectIdOrHexString } from 'mongoose';

import { ContractPayment } from "src/functionalities/contract-payments/entities/payment.entity"
import { ContractPending } from "src/functionalities/contract-pending/entities/pending.entity"
import { ContractNote } from 'src/functionalities/contract-notes/entities/note.entity'
import { Movement } from "src/functionalities/movements/entities/movement.entity"
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Contract } from "../entities/contracts.entity"
import { Utils } from 'src/common/utils/utils'
import { Company } from "src/auth/interfaces/login-response.interface";
import { User } from "src/functionalities/users/entities/user.entity";
import { UserReturnData } from "src/functionalities/users/interfaces/user-return-data.interface";
import { ObjectId } from "mongodb";

@Injectable()
export class ContractUtils {

  constructor(
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) { }

  public formatReturnPaymentListData = (payment: ContractPayment) => {
    return {
      id: payment.id,
      createdBy: payment.createdBy || null,
      client: payment.client || null,
      contract: payment.contract || null,
      payedAmount: this.utils.roundDecimals(payment.payedAmount),
      paymentAmount: this.utils.roundDecimals(payment.paymentAmount),
      paymentNumber: payment.paymentNumber,
      isComplete: payment.isComplete || false,
      paymentDate: payment.paymentDate || '',
      createdAt: payment.createdAt || '',
      updatedAt: payment.updatedAt || '',
    }
  }

  public formatReturnMovementListData = (movement: Movement) => {
    return {
      id: movement.id,
      createdBy: movement.createdBy || null,
      contract: movement.contract || null,
      amount: this.utils.roundDecimals(movement.amount),
      paymentPicture: movement.paymentPicture?.imageUrl || null,
      type: movement.type || '',
      status: movement.status || '',
      description: movement.description || '',
      movementDate: movement.movementDate || '',
      paymentType: movement.paymentType ? ( movement.paymentType === 'bank' ? 'Banco' : 'Efectivo' ) : 'Sin ingresar',
      createdAt: movement.createdAt || '',
      updatedAt: movement.updatedAt || '',
    }
  }

  public formatReturnUserData = (user: User, companies: Company[] = [], littleData: boolean = false, attrs: string[] = []): UserReturnData => {    

    const permission: string = user.role 
      ? this.utils.getUserPermissions(user.role.name) 
      : ''
    
    const { userData, routes, role } = user
    const supervisorRoutes = []
    const clientRoutes = []
    let route = null

    if(role.name !== 'companySupervisor' && role.name !== 'companyClient') {
      const routeClient = routes?.find((userRoute) => userRoute.role === role.name)
      route = routeClient ? routeClient.route : null
    } else {
      if(role.name === 'companySupervisor') {
        routes.forEach((routeUser) => {
          const { route } = routeUser
          const newRoute = {
            id: route._id,
            isActive: route.isActive,
            name: route.name,
            description: route.description,
            direction: route.direction,
            phoneNumber: route.phoneNumber,
            company: route.company,
            city: route.city,
            deletedAt: route.deletedAt,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
            deleted: route.deleted,
          }
          const newRouteUser = {
            id: routeUser._id,
            isActive: routeUser.isActive,
            route: newRoute,
            user: routeUser.user,
            role: routeUser.role,
            deletedAt: routeUser.deletedAt,
            createdAt: routeUser.createdAt,
            updatedAt: routeUser.updatedAt,
            deleted: routeUser.deleted,
          }
          supervisorRoutes.push(newRouteUser)
        });
      }
      if(role.name === 'companyClient') {
        routes.forEach((routeUser) => {
          const { route } = routeUser
          const newRoute = {
            id: route._id,
            isActive: route.isActive,
            name: route.name,
            description: route.description,
            direction: route.direction,
            phoneNumber: route.phoneNumber,
            company: route.company,
            city: route.city,
            deletedAt: route.deletedAt,
            createdAt: route.createdAt,
            updatedAt: route.updatedAt,
            deleted: route.deleted,
          }
          const newRouteUser = {
            id: routeUser._id,
            isActive: routeUser.isActive,
            route: newRoute,
            user: routeUser.user,
            role: routeUser.role,
            deletedAt: routeUser.deletedAt,
            createdAt: routeUser.createdAt,
            updatedAt: routeUser.updatedAt,
            deleted: routeUser.deleted,
          }
          clientRoutes.push(newRouteUser)
        });
      }
    }

    const mappedUser = {
      permission,
      id: user.id,
      email: user.email,
      identifier: user.identifier,
      identifierType: user.identifierType.name,
      country: user.country?.id,
      isLogged: user.isLogged || false,
      fullname: `${ this.utils.capitalizeFirstLetter(user.firstName).trim() } ${ this.utils.capitalizeFirstLetter(user.paternalSurname).trim() }` || '',
      firstName: this.utils.capitalizeFirstLetter(user.firstName).trim() || '',
      paternalSurname: this.utils.capitalizeFirstLetter(user.paternalSurname).trim() || '',
      profilePicture: userData?.profilePicture?.imageUrl || '',
      addressPicture: userData?.addressPicture?.imageUrl || '',
      securityQuestion: userData?.securityQuestion || '',
      phoneNumber: userData?.phoneNumber || '',
      points: userData?.points || 0,
      geolocation: userData?.geolocation || {},
      role: role?.name || '',
      gender: userData?.gender || '',
      residenceAddress: userData?.residenceAddress || '',
      billingAddress: userData?.billingAddress || '',
      entryDate: userData?.entryDate || '',
      city: userData?.cities?.length ? userData?.cities[0] : null,
      createdAt: user.createdAt,
      createdBy: user.createdBy ? `${ this.utils.capitalizeFirstLetter(user.createdBy.firstName).trim() } ${ this.utils.capitalizeFirstLetter(user.createdBy.paternalSurname).trim() }` : '',
      supervisorRoutes,
      clientRoutes,
      route,
    }

    if(user.role.name !== 'companySupervisor') delete mappedUser.supervisorRoutes
    if(user.role.name !== 'companyClient') delete mappedUser.clientRoutes

    if(littleData) {
      delete mappedUser.isLogged
      delete mappedUser.firstName
      delete mappedUser.paternalSurname
      delete mappedUser.profilePicture
      delete mappedUser.addressPicture
      delete mappedUser.securityQuestion
      delete mappedUser.points
      delete mappedUser.geolocation
      delete mappedUser.role
      delete mappedUser.gender
      delete mappedUser.residenceAddress
      delete mappedUser.billingAddress
      delete mappedUser.entryDate
      delete mappedUser.city
      delete mappedUser.createdAt
      delete mappedUser.createdBy
      delete mappedUser.supervisorRoutes
      delete mappedUser.route
    }

    return {
      user: mappedUser,
      companies: companies.map((company) => {
        return {
          id: company.id,
          isActive: company.isActive,
          name: company.name,
        };
      }),
    }
  }

  public formatReturnContractPending = (contractPending: ContractPending) => {
    const { client, contract } = contractPending
    const { notes, percent, modality } = contract
    const { type, days, weeks, fortnights, months } = modality

    const mappedClient: any = client
    const lastNote = notes?.pop()

    let modalityString = ''

    switch (type) {
      case 'daily':
        modalityString = `${ days } días`
        break;
    
      case 'weekly':
        modalityString = `${ weeks } semanas`
        break;
    
      case 'fortnightly':
        modalityString = `${ fortnights } quincenas`
        break;
    
      case 'monthly':
        modalityString = `${ months } meses`
        break;
    
      default:
        break;
    }

    const paymentDate = this.dayjsAdapter.getFormattedDateFromDateTime(contractPending.lastPaymentDate)
    const today = this.dayjsAdapter.getCurrentDate()

    const payedToday = today === paymentDate

    return {
      percent,
      clientName: contractPending.clientName,
      loanAmount: contractPending.loanAmount,
      totalAmount: this.utils.roundDecimals(contractPending.totalAmount),
      payedAmount: this.utils.roundDecimals(contractPending.payedAmount),
      pendingAmount: this.utils.roundDecimals(contractPending.pendingAmount),
      notValidatedAmount: this.utils.roundDecimals(contractPending.notValidatedAmount),
      paymentAmount: this.utils.roundDecimals(contractPending.paymentAmount),
      paymentsLate: contractPending.paymentsLate,
      paymentsUpToDate: contractPending.paymentsUpToDate,
      paymentsIncomplete: contractPending.paymentsIncomplete,
      paymentsRemaining: contractPending.paymentsRemaining,
      daysExpired: contractPending.daysExpired,
      daysAhead: contractPending.daysAhead,
      icon: payedToday ? 'dollar-sign' : contractPending.icon,
      color: contractPending.color,
      todayIncomplete: contractPending.todayIncomplete,
      daysPending: contractPending.daysPending,
      payedAmountProblem: contractPending.payedAmountProblem,
      isOutdated: contractPending.isOutdated,
      lastPaymentDate: contractPending.lastPaymentDate,
      note: lastNote ? {
        createdAt: lastNote?.createdAt,
        description: lastNote?.description,
        createdBy: `${ this.utils.capitalizeFirstLetter(lastNote?.createdBy?.firstName) } ${ this.utils.capitalizeFirstLetter(lastNote?.createdBy?.paternalSurname) }`,
      } : null,
      client: (mappedClient instanceof ObjectId) || !ObjectId.isValid(mappedClient) ? mappedClient : this.formatReturnUserData(mappedClient),
      modality: modalityString,
      payedToday
    }
  }

  /**
   * Formats the return data for a contract. This method structures the contract data to be returned,
   * including the ID, name, and associated contract. It only returns the data if the contract is active.
   *
   * @private
   * @function formatReturnData
   * @param {Contract} contract - The contract object to format.
   * @returns {object} An object containing the formatted contract data, or undefined if the contract is not active.
   */
  public formatReturnData = (contract: Contract): object => {

    const { route, client, createdBy, worker, contractPending } = contract
    
    return {
      id: contract?.id || null,
      contractNumber: contract?.contractNumber || 0,
      isActive: contract?.isActive || false,
      isValidated: contract?.isValidated || false,
      route: route && !isObjectIdOrHexString(route) ? {
        id: route.id,
        name: route.name,
        city: route.city?.name,
      } : null,
      company: contract?.company || {},
      client: client && !isObjectIdOrHexString(client) ? {
        id: client.id,
        fullname: `${ client.firstName } ${ client.paternalSurname }`,
      } : null,
      createdBy: createdBy && !isObjectIdOrHexString(createdBy) ? {
        id: createdBy.id,
        fullname: `${ createdBy.firstName } ${ createdBy.paternalSurname }`,
      } : null,
      worker: worker && !isObjectIdOrHexString(worker) ? {
        id: worker.id,
        fullname: `${ worker.firstName } ${ worker.paternalSurname }`,
      } : null,
      productPicture: contract?.productPicture?.imageUrl || null,
      contractPending: contractPending && !isObjectIdOrHexString(contractPending) ? this.formatReturnContractPending(contract.contractPending) : null,
      modality: contract?.modality || {},
      notes: contract?.notes?.map((e) => this.formatReturnNote(e)) || [],
      lastContractDate: contract?.lastContractDate || '',
      loanAmount: contract?.loanAmount || 0,
      percent: contract?.percent || 0,
      paymentsQuantity: contract?.paymentsQuantity || 0,
      totalAmount: contract?.totalAmount || 0,
      paymentAmount: contract?.paymentAmount || 0,
      paymentDays: contract?.paymentDays || [],
      nonWorkingDays: contract?.nonWorkingDays || '',
      createdAt: contract?.createdAt || '',
      updatedAt: contract?.updatedAt || '',
      paymentList: contract.paymentList?.map((e) => this.formatReturnPaymentListData(e)).sort((a,b) => a.paymentNumber - b.paymentNumber) || [],
      movementList: contract.movementList?.map((e) => this.formatReturnMovementListData(e)) || [],
    }
  }

  /**
   * Formats the return data for a note. This method structures the note data to be returned,
   * including the ID, name, and associated note. It only returns the data if the note is active.
   *
   * @private
   * @function formatReturnNote
   * @param {ContractNote} note - The note object to format.
   * @returns {object} An object containing the formatted note data, or undefined if the note is not active.
   */
  public formatReturnNote = (note: ContractNote): object => {
    return {
      id: note?.id,
      createdBy: `${ note?.createdBy.firstName } ${ note?.createdBy.paternalSurname }` || null,
      description: note?.description || '',
      createdAt: note?.createdAt || '',
    }
  }

  public setPaymentDays = ({
    currentDate,
    holidaysDates,
    paymentsQuantity,
    nonWorkingDays,
    modality,
  }) => {
    const paymentDays: any[] = []

    let paymentsIndex = 0
    while (paymentDays.length < paymentsQuantity) {
      
      const date = this.dayjsAdapter.sumDaysToDate(currentDate, paymentsIndex)
      const day = this.dayjsAdapter.getDayFromDate(date)
      const parsedDay = this.utils.parseDay(day)
      const isSameContractDate = this.dayjsAdapter.dateIsSame(date , currentDate)

      let isPayDay = (
        modality === 'daily' 
          ? !nonWorkingDays?.includes(parsedDay) 
          : nonWorkingDays?.includes(parsedDay)
      ) && !isSameContractDate

      const isHoliday = holidaysDates?.includes(date)

      if(isHoliday) {
        isPayDay = false
      }

      if(isPayDay) {
        paymentDays.push(date)
      }

      paymentsIndex++
    }

    return paymentDays
  }

  public recalculateContracts = ( contract: Contract ) => {
    try {

      const {
        movementList,
        paymentList,
        paymentAmount,
      } = contract;

      const orderedMovements = movementList
        .filter((movement) => movement.type === 'in' && movement.status === 'validated')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      
      const incompletePayments = []

      paymentList.forEach((payment) => {
        payment.movements = []
        payment.payedAmount = 0
        payment.isComplete = false
        incompletePayments.push(payment)
      })

      const paymentsToUpdate = [];

      for (const movement of orderedMovements) {

        if (movement.amount <= 0) continue;

        const relatedPayments = incompletePayments.filter((payment) => payment.movements?.includes(movement.id))
        const processedAmount = relatedPayments.reduce((sum, payment) => sum + payment.payedAmount, 0)

        let remainingAmount = movement.amount - processedAmount;

        if (remainingAmount <= 0) continue;

        for (let i = 0; i < incompletePayments.length; i++) {
          
          const payment = incompletePayments[i];

          const outstandingAmount = paymentAmount - (payment.payedAmount || 0);

          if (outstandingAmount <= 0) continue;

          const amountToAdd = Math.min(remainingAmount, outstandingAmount);

          payment.payedAmount += amountToAdd;
          payment.movements = [...new Set([...(payment.movements || []), movement.id])];
          payment.isComplete = payment.payedAmount >= paymentAmount;
          payment.updatedAt = this.dayjsAdapter.getCurrentDateTime()

          if (!paymentsToUpdate.some((pay) => pay._id.equals(payment._id))) {
            paymentsToUpdate.push(payment);
          }

          remainingAmount -= amountToAdd;

          if (payment.isComplete) {
            incompletePayments.splice(i, 1);
            i--;
          }

          if (remainingAmount <= 0) break;
        }
      }

      let bulkOperations = [];

      if (paymentsToUpdate.length > 0) {

        bulkOperations = [ ...paymentList, ...paymentsToUpdate ].map((payment) => ({
          updateOne: {
            filter: { _id: payment._id },
            update: {
              payedAmount: payment.payedAmount,
              isComplete: payment.isComplete,
              movements: payment.movements,
              updatedAt: payment.updatedAt,
            },
          },
        }));
      }

      return bulkOperations

    } catch (error) {
      // console.log("🚀 ~ PaymentsService ~ recalculateContracts= ~ error:", error)
      throw Error(error)
    }
  }

  public updatePendingModel = (contract: Contract): ContractPending => {
    try {
      
      const { contractPending, paymentList, movementList, paymentDays, paymentsQuantity, totalAmount } = contract

      const orderedMovements = movementList
        .filter((movement) => movement.type === 'in')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      const validatedAmountRemaining = movementList
        .filter((movement) => movement.status === 'validated' && movement.type === 'in')
        .reduce((amount, movement) => amount + movement.amount, 0);
      
      const pendingAmountRemaining = movementList
        .filter((movement) => movement.status === 'pending' && movement.type === 'in')
        .reduce((amount, movement) => amount + movement.amount, 0);

      const payedAmount = validatedAmountRemaining
      const pendingAmount = totalAmount - validatedAmountRemaining
      const notValidatedAmount = pendingAmountRemaining
      const lastMovement = orderedMovements[orderedMovements.length - 1]

      const today = this.dayjsAdapter.getCurrentDate()
      const contractEndDate = paymentDays[paymentDays.length - 1]
      const contractExpired = this.dayjsAdapter.dateIsAfter(today, contractEndDate, false)

      let color = ''
      let daysLate = 0
      let daysPayed = 0
      let daysAhead = 0
      let daysExpired = 0
      let daysPending = 0
      let daysIncomplete = 0
      let todayIncomplete = false
      let todayHavePayments = false
      let amountLateOrIncomplete = 0

      paymentList.forEach((payment) => {

        const { paymentDate, isComplete, payedAmount } = payment
        
        const isBefore = this.dayjsAdapter.dateIsBefore(paymentDate, today, false)
        const isToday = this.dayjsAdapter.dateIsSame(paymentDate, today)
        const isAhead = this.dayjsAdapter.dateIsAfter(paymentDate, today, false)

        if(!isComplete && payedAmount > 0) {
          daysIncomplete++
          if(isToday) {
            amountLateOrIncomplete += payedAmount
            todayIncomplete = true
          }
        }

        if(isToday && payedAmount > 0) {
          todayHavePayments = true
        }

        if(payedAmount === 0) {
          daysPending++
        }

        if((isBefore || isToday) && payedAmount === 0) {
          daysLate++
        }

        if(isAhead && payedAmount > 0) {
          daysAhead++
        }

        if(isComplete) {
          daysPayed++
        }
      });

      if(contractExpired && pendingAmount > 0) {
        daysExpired = this.dayjsAdapter.dateDifference(today, contractEndDate, 'days', false)
      }

      const icon = todayHavePayments ? 'target' : ''

      if(daysLate > 0 && daysAhead === 0) {
        color = daysLate <= 3 ? '' : 'orange'
      }

      if(daysExpired > 0 && daysAhead === 0) {
        color = 'red'
      }
      
      if(daysAhead > 0) {
        color = 'green'
      }

      if(daysIncomplete == 0 && daysPending == 0 && daysExpired == 0 && daysLate == 0) {
        color = 'green'
      }

      contractPending.payedAmount = payedAmount
      contractPending.notValidatedAmount = notValidatedAmount
      contractPending.pendingAmount = pendingAmount
      contractPending.paymentsLate = daysLate
      contractPending.paymentsUpToDate = daysPayed
      contractPending.paymentsIncomplete = daysIncomplete
      contractPending.paymentsRemaining = paymentsQuantity - daysPayed
      contractPending.daysExpired = daysExpired
      contractPending.daysAhead = daysAhead
      contractPending.icon = icon
      contractPending.color = color
      contractPending.todayIncomplete = todayIncomplete
      contractPending.daysPending = daysPending
      contractPending.isOutdated = contractExpired
      contractPending.amountLateOrIncomplete = amountLateOrIncomplete
      contractPending.lastPaymentDate = lastMovement?.createdAt || '01/01/1900'

      // console.log("🚀 ~ ContractUtils ~ contractPending:", contractPending)
      return contractPending

    } catch (error) {
      // console.log("🚀 ~ PaymentsService ~ updatePendingModel= ~ error:", error)
      throw Error(error)
      
    }
  }
}