import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Track, TrackSchema } from '../tracks/entities/track.entity';
import { Role, RoleSchema } from './entities/role.entity';
import { CommonModule } from 'src/common/common.module';
import { RolesController } from './roles.controller';
import { AuthModule } from 'src/auth/auth.module';
import { RolesService } from './roles.service';

@Module({
  controllers: [ RolesController ],
  providers: [ RolesService ],
  imports: [
    AuthModule,
    ConfigModule,
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Track.name,
        schema: TrackSchema
      },
      {
        name: Role.name,
        schema: RoleSchema
      },
    ], 'default')
  ],
  exports: [ RolesService ],
})
export class RolesModule {}
