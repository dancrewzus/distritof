import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { PaymentsService } from './payments.service';
import { User } from '../users/entities/user.entity';
import { CreateTDCPaymentDto, CreateTransferPaymentDto, UpdateTransferPaymentDto } from './dto';
import { Payment } from './entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {

  constructor(
    private readonly paymentsService: PaymentsService
  ) {}

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Payments found', type: [Payment] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @GetUser() user: User,
  ) {
    return this.paymentsService.findMany(paginationDto, user);
  }

  @Get('secret')
  @HttpCode(201)
  @Auth(ValidRoles.CompanyOwner)
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  getSecret(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Query('licenseId') licenseId: string,
    @Query('companyId') companyId: string,
    @Query('isLicensePayment') isLicensePayment: boolean,
  ) {
    return this.paymentsService.getSecret(licenseId, companyId, isLicensePayment, user, clientIp);
  }

  @Post('/tdc')
  @HttpCode(201)
  @Auth(ValidRoles.CompanyOwner)
  @ApiResponse({ status: 201, description: 'Payment created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  createTDCPayments(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createTDCPaymentDto: CreateTDCPaymentDto,
  ) {
    return this.paymentsService.createTDCPayments(createTDCPaymentDto, user, clientIp);
  }

  @Post('/transfer')
  @HttpCode(201)
  @Auth(ValidRoles.CompanyOwner)
  @ApiResponse({ status: 201, description: 'Payment created', type: Payment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  createTransferPayments(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createTransferPaymentDto: CreateTransferPaymentDto,
  ) {
    return this.paymentsService.createTransferPayments(createTransferPaymentDto, user, clientIp);
  }

  @Patch('/transfer/:id')
  @HttpCode(201)
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Payment updated', type: Payment })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  updateStatusTransferPayments(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateTransferPaymentDto: UpdateTransferPaymentDto,
    @GetUser() user: User,
  ) {
    return this.paymentsService.updateStatusTransferPayments(id, updateTransferPaymentDto, user, clientIp);
  }
}