import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateIdentifierDto, UpdateIdentifierDto } from './dto';
import { IdentifiersService } from './identifiers.service';
import { Identifier } from './entities/identifier.entity';
import { User } from '../users/entities/user.entity';

@ApiTags('Identifiers')
@Controller('identifiers')
export class IdentifiersController {

  constructor(
    private readonly identifiersService: IdentifiersService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 201, description: 'Identifier created', type: Identifier })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createIdentifierDto: CreateIdentifierDto,
  ) {
    return this.identifiersService.create(createIdentifierDto, user, clientIp);
  }

  @Get()
  @Auth()
  @ApiResponse({ status: 200, description: 'Identifiers found', type: [Identifier] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @GetUser() user: User,
    @Query('pagination') paginationDto: PaginationDto,
  ) {
    return this.identifiersService.findMany(paginationDto, user);
  }

  @Get('/register')
  @ApiResponse({ status: 200, description: 'Identifiers found', type: [Identifier] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findForRegister() {
    return this.identifiersService.findForRegister();
  }

  @Get('/find/:id')
  @Auth()
  @ApiResponse({ status: 200, description: 'Identifier found', type: Identifier })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.identifiersService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Identifier updated', type: Identifier })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateIdentifierDto: UpdateIdentifierDto,
    @GetUser() user: User
  ) {
    return this.identifiersService.update(id, updateIdentifierDto, user, clientIp);
  }

  @Delete(':id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Soft delete identifier.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  remove(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.identifiersService.remove(id, user, clientIp);
  }
}
