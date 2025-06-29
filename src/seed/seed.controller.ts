import { Controller, Get, Query } from '@nestjs/common';

import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get('all')
  seedAll() {
    return this.seedService.seedAll();
  }
  
  @Get('backup')
  backupData(
    @Query('target_environment') env: string,
  ) {
    return this.seedService.backupData(env);
  }
  
  // @Get('trainings')
  // getTrainings() {
  //   return this.seedService.getTrainings();
  // }
}
