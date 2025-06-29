import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateCountryDto, UpdateCountryDto } from './dto';
import { CountriesService } from './countries.service';
import { Country } from './entities/country.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {

  constructor(
    private readonly countriesService: CountriesService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 201, description: 'Country created', type: Country })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createCountryDto: CreateCountryDto,
  ) {
    return this.countriesService.create(createCountryDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Countries found', type: [Country] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @GetUser() user: User,
  ) {
    return this.countriesService.findMany(paginationDto, user);
  }

  @Get('/register')
  @ApiResponse({ status: 200, description: 'Countries found', type: [Country] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findForRegister() {
    return this.countriesService.findForRegister();
  }

  @Get('/find/:id')
  @Auth()
  @ApiResponse({ status: 200, description: 'Country found', type: Country })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.countriesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Country updated', type: Country })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateCountryDto: UpdateCountryDto,
    @GetUser() user: User
  ) {
    return this.countriesService.update(id, updateCountryDto, user, clientIp);
  }

  @Delete(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
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
    return this.countriesService.remove(id, user, clientIp);
  }
}
