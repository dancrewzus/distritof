import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cron } from '@nestjs/schedule'
import { Model } from 'mongoose'

import { ContractPayment } from 'src/functionalities/contract-payments/entities/payment.entity'
import { ContractPending } from 'src/functionalities/contract-pending/entities/pending.entity'
import { DailyResume } from 'src/functionalities/movements/entities/daily-resume.entity'
import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { ContractUtils } from 'src/functionalities/contracts/utils/contract.utils'
import { MovementsService } from 'src/functionalities/movements/movements.service'
import { Movement } from 'src/functionalities/movements/entities/movement.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { ImagesService } from 'src/functionalities/images/images.service'
import { Image } from 'src/functionalities/images/entities/image.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { CloudAdapter } from 'src/common/adapters/cloud.adapter'
import { error } from 'src/common/constants/error-messages'
import { SeedService } from '../seed/seed.service'
import { ContractNote } from 'src/functionalities/contract-notes/entities/note.entity'

@Injectable()
export class JobsService {

  private readonly logger = new Logger(JobsService.name);

  constructor(
    // @InjectModel(ContractPending.name, 'default') private readonly pendingModel: Model<ContractPending>,
    // @InjectModel(DailyResume.name, 'default') private readonly dailyResumeModel: Model<DailyResume>,
    @InjectModel(ContractPayment.name, 'default') private readonly paymentModel: Model<ContractPayment>,
    @InjectModel(ContractNote.name, 'default') private readonly noteModel: Model<ContractNote>,
    @InjectModel(Contract.name, 'default') private readonly contractModel: Model<Contract>,
    @InjectModel(Movement.name, 'default') private readonly movementModel: Model<Movement>,
    // @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    // @InjectModel(Image.name, 'default') private readonly imageModel: Model<Image>,
    // private readonly movementsService: MovementsService,
    private readonly imagesService: ImagesService,
    private readonly contractUtils: ContractUtils,
    // private readonly cloudAdapter: CloudAdapter,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly seedService: SeedService,
  ) { }

  private hasContractPendingChanged(current: ContractPending, updated: ContractPending): boolean {
    if (!current) return true;
  
    return (
      current.payedAmount !== updated.payedAmount ||
      current.pendingAmount !== updated.pendingAmount ||
      current.notValidatedAmount !== updated.notValidatedAmount ||
      current.amountLateOrIncomplete !== updated.amountLateOrIncomplete ||
      current.paymentsLate !== updated.paymentsLate ||
      current.paymentsUpToDate !== updated.paymentsUpToDate ||
      current.paymentsIncomplete !== updated.paymentsIncomplete ||
      current.paymentsRemaining !== updated.paymentsRemaining ||
      current.daysExpired !== updated.daysExpired ||
      current.daysAhead !== updated.daysAhead ||
      current.icon !== updated.icon ||
      current.color !== updated.color ||
      current.todayIncomplete !== updated.todayIncomplete ||
      current.daysPending !== updated.daysPending ||
      current.isOutdated !== updated.isOutdated ||
      current.lastPaymentDate !== updated.lastPaymentDate
    );
  }

  private removeImage = async (id: string) => {
    try {
      await this.imagesService.remove(id)
      return
    } catch (error) {
      this.logger.error('Remove image failed.', error);
    }
  }

  private removeMovement = async (id: string) => {
    try {
      const movementResponse = await this.movementModel.findById(id).populate('paymentPicture')

      const { paymentPicture } = movementResponse
      
      if(paymentPicture) {
        await Promise.all([
          this.removeImage(paymentPicture.publicId),
          paymentPicture.deleteOne(),
        ])
      }

      await movementResponse.deleteOne()

      return
  
    } catch (error) {
      this.logger.error('Remove movement failed.', error);
    }
  }

  private removePayment = async (id: string) => {
    try {
      await this.paymentModel.deleteOne({ _id: id })
      return
    } catch (error) {
      this.logger.error('Remove movement failed.', error);
    }  
  }

  private removeNote = async (id: string) => {
    try {
      await this.noteModel.deleteOne({ _id: id })
      return
    } catch (error) {
      this.logger.error('Remove movement failed.', error);
    }  
  }

  private removeContract = async (contract: Contract) => {
    try {
      const { productPicture, contractPending, notes, movementList, paymentList } = contract

      if(productPicture) {
        await Promise.all([
          this.removeImage(productPicture.publicId),
          productPicture.deleteOne(),
        ])
      }

      await Promise.all([
        contractPending.deleteOne(),
        notes.map(note => this.removeNote(note.id)),
        movementList.map(movement => this.removeMovement(movement.id)),
        paymentList.map(payment => this.removePayment(payment.id)),
      ])
      
    } catch (error) {
      this.logger.error('Remove contract failed.', error);
    }
  }

  private removeFinishedContracts = async () => {
    try {
      const currentDate = this.dayjsAdapter.getCurrentDateTime();
      const finishedContracts = await this.contractModel.find({ isActive: false })
        .populate({
          path: 'productPicture contractPending notes movementList paymentList',
        });
      for (let index = 0; index < finishedContracts.length; index++) {
        const finishedContract = finishedContracts[index];
        
        const { finishedAt } = finishedContract

        if(finishedAt) {
          if(this.dayjsAdapter.dateDifference(currentDate, 'days', true) > 21) {
            await this.removeContract(finishedContract)
          }
        } else {
          await this.removeContract(finishedContract)
        }
      }
    } catch (error) {
      this.logger.error('Delete finished contracts failed.', error);
    }
  }

  public generateDailyResume = async (type: string) => {
    try {
      // const currentDate = this.dayjsAdapter.getCurrentDate();
      // const companies = await this.companyModel.find(); 

      // const dailyResumes = await Promise.all(
      //   companies.map(async (company) => {
      //     const resumeResponse = await this.movementsService.getResume(
      //       { selectedCompany: company._id, selectedWorker: 'general', selectedRoute: 'general' },
      //       null,
      //       false
      //     );
      //     if (!resumeResponse?.data) return null;
      
      //     return {
      //       type,
      //       company: company._id,
      //       beforeAmount: 0, // TODO: Calcular esto
      //       ...resumeResponse.data,
      //       dailyResumeDate: currentDate,
      //       createdAt: this.dayjsAdapter.getCurrentDateTime(),
      //       updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      //     };
      //   })
      // );
      
      // // Filtrar resultados nulos y guardar en BD
      // // await this.dailyResumeModel.insertMany(dailyResumes.filter(Boolean));
  
      // // Guardamos los resultados en la base de datos
      // // await this.dailyResumeModel.insertMany(dailyResumes);
      // console.log("🚀 ~ JobsService ~ generateDailyResume= ~ dailyResumes:", dailyResumes)
      // console.log(`Se han ingresado ${dailyResumes.length} registros en la tabla.`);
      
    } catch (error) {
      this.logger.error('Daily resume job failed.', error);
    }
  }
  
  public calculatePendingPayments = async () => {
    try {
      const activeContracts = await this.contractModel.find({ isActive: true })
        .populate('contractPending paymentList movementList');
    
      let updatedPendingPayments = 0
      await Promise.all(activeContracts.map(async (contract) => {
        try {
          const { contractPending } = JSON.parse(JSON.stringify(contract))
          const updatedContractPending = this.contractUtils.updatePendingModel(contract);
    
          if (this.hasContractPendingChanged(contractPending, updatedContractPending)) {
            await updatedContractPending.save();
            updatedPendingPayments++
          }
        } catch (error) {
          this.logger.error(`Error updating contract ${contract._id}:`, error);
        }
      }));
    
    } catch (error) {
      this.logger.error('Pending payments job failed.', error);
    }
  }

  public checkContracts = async () => {
    try {
      const activeContracts = await this.contractModel.find({ isActive: true })
        .populate('contractPending paymentList movementList');
      console.log("🚀 ~ JobsService ~ checkContracts= ~ activeContracts:", activeContracts)

      // await Promise.all(activeContracts.map(async (contract) => {
      //   try {
      //     const { contractPending } = JSON.parse(JSON.stringify(contract))
      //     const updatedContractPending = this.contractUtils.updatePendingModel(contract);
    
      //     if (this.hasContractPendingChanged(contractPending, updatedContractPending)) {
      //       await updatedContractPending.save();
      //     }
      //   } catch (error) {
      //     this.logger.error(`Error updating contract ${contract._id}:`, error);
      //   }
      // }));
    
    } catch (error) {
      this.logger.error('Pending payments job failed.', error);
    }
  }

  @Cron('0 0 * * *',{
    timeZone: 'America/Manaus'
  }) // Se ejecutará todos los días a la medianoche
  async executeBackup() {
    try {
      await this.seedService.backupAndSendEmail();
    } catch (error) {
      this.logger.error('Database backup job failed.', error);
    }
  }

  @Cron('5 0 * * *', {
    timeZone: 'America/Manaus',
  }) // Se ejecutará todos los días a las 12:05 AM
  async executeEarlyMorningDailyResume () {
    await this.generateDailyResume('early-morning')
  }

  @Cron('* 2 * * *', {
    timeZone: 'America/Manaus',
  }) // Se ejecutará todos los días a las 02:00 AM
  async executePendingPayments() {
    await this.calculatePendingPayments()
  }

  @Cron('* 1 * * *', {
    timeZone: 'America/Manaus',
  }) // Se ejecutará todos los días a las 01:00 AM
  async executeRemoveFinishedContracts() {
    await this.removeFinishedContracts()
  }
  
  @Cron('35 23 * * *', {
    timeZone: 'America/Manaus',
  }) // Se ejecutará todos los días a las 11:35 PM
  async executeLateNightDailyResume () {
    await this.generateDailyResume('late-night')
  }
  
}


