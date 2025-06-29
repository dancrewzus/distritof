import { Controller, Get } from '@nestjs/common'

import { JobsService } from './jobs.service'


@Controller('jobs')
// @Auth()
export class JobsController {

  constructor(private readonly jobsService: JobsService) {}
  
  @Get('/daily-resume')
  calculateDailyResume() {
    return this.jobsService.generateDailyResume('late-night')
  }
  
  @Get('/pending-payments')
  calculatePendingPayments() {
    return this.jobsService.calculatePendingPayments()
  }
  
  @Get('/check-contracts')
  checkContracts() {
    return this.jobsService.checkContracts()
  }
}
