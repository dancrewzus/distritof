import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto';
import { CurrenciesService } from './currencies.service';
import { Currency } from './entities/currency.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {

  constructor(
    private readonly currenciesService: CurrenciesService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 201, description: 'Currency created', type: Currency })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createCurrencyDto: CreateCurrencyDto,
  ) {
    return this.currenciesService.create(createCurrencyDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Currencies found', type: [Currency] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @GetUser() user: User,
  ) {
    return this.currenciesService.findMany(paginationDto, user);
  }

  @Get('/register')
  @ApiResponse({ status: 200, description: 'Currencies found', type: [Currency] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findForRegister() {
    return this.currenciesService.findForRegister();
  }

  @Get('/find/:id')
  @Auth()
  @ApiResponse({ status: 200, description: 'Currency found', type: Currency })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.currenciesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Currency updated', type: Currency })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateCurrencyDto: UpdateCurrencyDto,
    @GetUser() user: User
  ) {
    return this.currenciesService.update(id, updateCurrencyDto, user, clientIp);
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
    return this.currenciesService.remove(id, user, clientIp);
  }
}
