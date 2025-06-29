import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateCityDto, UpdateCityDto } from './dto';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Cities')
@Controller('cities')
export class CitiesController {

  constructor(
    private readonly citiesService: CitiesService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 201, description: 'City created', type: City })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createCityDto: CreateCityDto,
  ) {
    return this.citiesService.create(createCityDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Cities found', type: [City] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    @GetUser() user: User,
  ) {
    return this.citiesService.findMany(paginationDto, companyId, user);
  }

  @Get('/register')
  @Auth()
  @ApiResponse({ status: 200, description: 'Cities found', type: [City] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findForRegister(
    @Query('company') companyId: string,
  ) {
    return this.citiesService.findForRegister(companyId);
  }

  @Get('/find/:id')
  @Auth()
  @ApiResponse({ status: 200, description: 'City found', type: City })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.citiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'City updated', type: City })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateCityDto: UpdateCityDto,
    @GetUser() user: User
  ) {
    return this.citiesService.update(id, updateCityDto, user, clientIp);
  }

  @Delete(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'User password reset.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  remove(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.citiesService.remove(id, user, clientIp);
  }
}
