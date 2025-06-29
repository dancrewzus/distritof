import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe'
import { GetUser } from 'src/auth/decorators/get-user.decorator'
import { PaginationDto } from 'src/common/dto/pagination.dto'
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { User } from '../users/entities/user.entity'
import { CreateRoleDto, UpdateRoleDto } from './dto'
import { RolesService } from './roles.service'
import { Role } from './entities/role.entity'

@ApiTags('Roles')
@Controller('roles')
@Auth(ValidRoles.Root)
export class RolesController {

  constructor(
    private readonly rolesService: RolesService
  ) {}

  @Post()
  @HttpCode(201)
  @ApiResponse({ status: 201, description: 'Role created', type: Role })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createRoleDto: CreateRoleDto,
  ) {
    return this.rolesService.create(createRoleDto, user, clientIp);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Roles found', type: [Role] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
  ) {
    return this.rolesService.findMany(paginationDto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Role found', type: Role })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Role updated', type: Role })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @GetUser() user: User
  ) {
    return this.rolesService.update(id, updateRoleDto, user, clientIp);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Soft delete Role.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  remove(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.rolesService.remove(id, user, clientIp);
  }
}
