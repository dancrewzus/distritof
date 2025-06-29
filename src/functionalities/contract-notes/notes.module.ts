import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Contract, ContractSchema } from '../contracts/entities/contracts.entity';
import { Company, CompanySchema } from '../companies/entities/company.entity';
import { ContractNote, ContractNoteSchema } from './entities/note.entity'
import { Route, RouteSchema } from '../routes/entities/route.entity';
import { Track, TrackSchema } from '../tracks/entities/track.entity'
import { User, UserSchema } from '../users/entities/user.entity';
import { CommonModule } from '../../common/common.module'
import { NotesController } from './notes.controller'
import { RolesModule } from '../roles/roles.module'
import { AuthModule } from 'src/auth/auth.module'
import { NotesService } from './notes.service'

@Module({
  controllers: [ NotesController ],
  providers: [ NotesService ],
  imports: [
    AuthModule,
    RolesModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Track.name,
        schema: TrackSchema
      },
      {
        name: ContractNote.name,
        schema: ContractNoteSchema
      },
      {
        name: Company.name,
        schema: CompanySchema
      },
      {
        name: Route.name,
        schema: RouteSchema
      },
      {
        name: Contract.name,
        schema: ContractSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
    ], 'default')
  ], 
  exports: [ NotesService ]
})
export class NotesModule {}
