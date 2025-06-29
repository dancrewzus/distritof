import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { CreateNeighborhoodDto, UpdateNeighborhoodDto } from './dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { NeighborhoodsService } from './neighborhoods.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Neighborhood } from './entities/neighborhood.entity';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Neighborhoods')
@Controller('neighborhoods')
export class NeighborhoodsController {

  constructor(
    private readonly neighborhoodsService: NeighborhoodsService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 201, description: 'Neighborhood created', type: Neighborhood })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createNeighborhoodDto: CreateNeighborhoodDto,
  ) {
    return this.neighborhoodsService.create(createNeighborhoodDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Neighborhoods found', type: [Neighborhood] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    @GetUser() user: User,
  ) {
    return this.neighborhoodsService.findMany(paginationDto, companyId, user);
  }

  @Get('/find/:id')
  @Auth()
  @ApiResponse({ status: 200, description: 'Neighborhood found', type: Neighborhood })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.neighborhoodsService.findOne(id);
  }

  @Patch(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'Neighborhood updated', type: Neighborhood })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateNeighborhoodDto: UpdateNeighborhoodDto,
    @GetUser() user: User
  ) {
    return this.neighborhoodsService.update(id, updateNeighborhoodDto, user, clientIp);
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
    return this.neighborhoodsService.remove(id, user, clientIp);
  }
}
