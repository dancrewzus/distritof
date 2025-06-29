import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { MongooseModule } from '@nestjs/mongoose';

import { CommonModule } from 'src/common/common.module'
import { SeedService } from 'src/seed/seed.service';
import { SeedData } from 'src/seed/data/data.seed';
import { SeedModule } from 'src/seed/seed.module';

import { MODELS } from 'src/common/constants/models.constants';
import { JobsController } from './jobs.controller';
import { MovementsService } from 'src/functionalities/movements/movements.service';
import { ImagesService } from 'src/functionalities/images/images.service';
import { ContractUtils } from 'src/functionalities/contracts/utils/contract.utils';

@Module({
  controllers: [ JobsController ],
  providers: [ JobsService, SeedService, SeedData, MovementsService, ImagesService, ContractUtils ],
  imports: [
    CommonModule,
    SeedModule,
    MongooseModule.forFeature(MODELS, 'default'),
    MongooseModule.forFeature(MODELS, 'production'),
    MongooseModule.forFeature(MODELS, 'test'),
    MongooseModule.forFeature(MODELS, 'development'),
    MongooseModule.forFeature(MODELS, 'backup'),
  ],
})
export class JobsModule {}