import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'

import { CommonModule } from 'src/common/common.module'
import { SeedController } from './seed.controller'
import { SeedService } from './seed.service'
import { SeedData } from './data/data.seed'

import { MODELS } from 'src/common/constants/models.constants'

@Module({
  controllers: [ SeedController ],
  providers: [ SeedService, SeedData ],
  imports: [
    HttpModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature(MODELS, 'production'),
    MongooseModule.forFeature(MODELS, 'test'),
    MongooseModule.forFeature(MODELS, 'development'),
    MongooseModule.forFeature(MODELS, 'backup'),
  ],
  exports: [ SeedService ]
})
export class SeedModule {}
