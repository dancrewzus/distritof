import { Controller, Post, Body, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { Contract } from 'src/functionalities/contracts/entities/contracts.entity';
import { User } from 'src/functionalities/users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { PaymentsService } from './payments.service';

@Controller('contract-payments')
export class PaymentsController {
  
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiResponse({ status: 201, description: 'Contract created', type: Contract })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @Body() createPaymentsDto: CreatePaymentDto,
    @GetUser() user: User
  ) {
    return this.paymentsService.create(createPaymentsDto, user, clientIp);
  }
}
