import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateParameterDto, UpdateParameterDto } from './dto';
import { ParametersService } from './parameters.service';
import { Parameter } from './entities/parameter.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Parameters')
@Controller('parameters')
export class ParametersController {

  constructor(
    private readonly parametersService: ParametersService
  ) {}

  @Get()
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
  )
  @ApiResponse({ status: 200, description: 'Parameters found', type: [Parameter] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Ip() clientIp: string,
    @Query('company') companyId: string,
    @GetUser() user: User,
  ) {
    return this.parametersService.findOne(companyId, user, clientIp);
  }

  @Patch(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'Parameter updated', type: Parameter })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateParameterDto: UpdateParameterDto,
    @GetUser() user: User
  ) {
    return this.parametersService.update(id, updateParameterDto, user, clientIp);
  }
}
