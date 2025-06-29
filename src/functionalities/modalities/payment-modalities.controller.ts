import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreatePaymentModalityDto, UpdatePaymentModalityDto } from './dto';
import { PaymentModalitiesService } from './payment-modalities.service';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { PaymentModality } from './entities/payment-modality.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('PaymentModalities')
@Controller('payment-modalities')
export class PaymentModalitiesController {

  constructor(
    private readonly modalitiesService: PaymentModalitiesService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 201, description: 'Modality created', type: PaymentModality })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createPaymentModalityDto: CreatePaymentModalityDto,
  ) {
    return this.modalitiesService.create(createPaymentModalityDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Countries found', type: [PaymentModality] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    @GetUser() user: User,
  ) {
    return this.modalitiesService.findMany(paginationDto, companyId, user);
  }

  @Get('/register')
  @ApiResponse({ status: 200, description: 'Countries found', type: [PaymentModality] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findForRegister() {
    return this.modalitiesService.findForRegister();
  }

  @Get('/find/:id')
  @Auth()
  @ApiResponse({ status: 200, description: 'Modality found', type: PaymentModality })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.modalitiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'Modality updated', type: PaymentModality })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updatePaymentModalityDto: UpdatePaymentModalityDto,
    @GetUser() user: User
  ) {
    return this.modalitiesService.update(id, updatePaymentModalityDto, user, clientIp);
  }

  @Delete(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'Modality remove.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  remove(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.modalitiesService.remove(id, user, clientIp);
  }
}
