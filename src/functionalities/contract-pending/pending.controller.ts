import { Controller, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetUser } from 'src/auth/decorators/get-user.decorator'
import { PaginationDto } from 'src/common/dto/pagination.dto'
import { ContractPending } from './entities/pending.entity'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { User } from '../users/entities/user.entity'
import { PendingService } from './pending.service'

@ApiTags('Contract Pending')
@Controller('contract-pending')
export class PendingController {

  constructor(
    private readonly pendingService: PendingService
  ) {}

  @Get('/resume')
  @Auth()
  @ApiResponse({ status: 200, description: 'Pending contracts resume', type: Object })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findForRegister(
    @Query('company') company: string,
    @Query('route') route: string,
    @GetUser() user: User
  ) {
    return this.pendingService.getResume(user, company, route);
  }

  @Get('/filter/list')
  @Auth()
  @ApiResponse({ status: 200, description: 'Contracts with pending payments found', type: [ContractPending] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findMany(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') company: string,
    @Query('route') route: string,
    @GetUser() user: User
  ) {
    return this.pendingService.findMany(paginationDto, user, company, route)
  }
}
