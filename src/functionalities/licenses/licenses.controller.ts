import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateLicenseDto, UpdateLicenseDto } from './dto';
import { LicensesService } from './licenses.service';
import { License } from './entities/license.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Licenses')
@Controller('licenses')
export class LicensesController {

  constructor(
    private readonly licensesService: LicensesService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 201, description: 'License created', type: License })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createLicenseDto: CreateLicenseDto,
  ) {
    return this.licensesService.create(createLicenseDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Licenses found', type: [License] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @GetUser() user: User,
    @Query('pagination') paginationDto: PaginationDto,
  ) {
    return this.licensesService.findMany(paginationDto, user);
  }

  @Get(':id')
  @Auth()
  @ApiResponse({ status: 200, description: 'License found', type: License })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.licensesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'License updated', type: License })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateLicenseDto: UpdateLicenseDto,
    @GetUser() user: User
  ) {
    return this.licensesService.update(id, updateLicenseDto, user, clientIp);
  }

  @Delete(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Soft delete License.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  remove(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.licensesService.remove(id, user, clientIp);
  }
}
