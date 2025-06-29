import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

import { UsersAdministratorsService } from './services/users-administrators.service';
import { UsersCompanyOwnersService } from './services/users-company-owners.service';
import { UsersCompanyAdministratorsService } from './services/users-company-administrators.service';
import { UsersCompanySupervisorsService } from './services/users-company-supervisors.service';
import { UsersCompanyWorkersService } from './services/users-company-workers.service';
import { UsersCompanyClientsService } from './services/users-company-clients.service';
import { UsersService } from './services/users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {

  constructor(
    private readonly usersAdministratorsService: UsersAdministratorsService,
    private readonly usersCompanyOwnersService: UsersCompanyOwnersService,
    private readonly usersCompanyAdministratorsService: UsersCompanyAdministratorsService,
    private readonly usersCompanySupervisorsService: UsersCompanySupervisorsService,
    private readonly usersCompanyWorkersService: UsersCompanyWorkersService,
    private readonly usersCompanyClientsService: UsersCompanyClientsService,
    private readonly usersService: UsersService
  ) {}

  // ============== 
  // SYSTEM GENERAL
  // ============== 

    @Post()
    @HttpCode(201)
    @Auth(
      ValidRoles.Root,
      ValidRoles.Administrator,
      ValidRoles.CompanyOwner,
      ValidRoles.CompanyAdmin,
      ValidRoles.companyWorker,
    )
    @ApiResponse({ status: 201, description: 'User created', type: User })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 422, description: 'Unprocessable entity' })
    @ApiResponse({ status: 500, description: 'Internal error' })
    create(
      @Ip() clientIp: string,
      @Body() createUserDto: CreateUserDto,
      @GetUser() user: User,
    ) {
      const { role } = createUserDto;
      // console.log("🚀 ~ UsersController ~ role:", role)

      switch (role) {
        case 'companyClient': return this.usersCompanyClientsService.create(createUserDto, user, clientIp)
        case 'companyAdmin': return this.usersCompanyAdministratorsService.create(createUserDto, user, clientIp)
        case 'companySupervisor': return this.usersCompanySupervisorsService.create(createUserDto, user, clientIp)
        case 'companyWorker': return this.usersCompanyWorkersService.create(createUserDto, user, clientIp)
        default: return this.usersService.create(createUserDto, user, clientIp)
      }
    }
    
    @Get()
    @Auth(
      ValidRoles.Root,
      ValidRoles.Administrator,
    )
    @ApiResponse({ status: 200, description: 'Users found', type: [User] })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Not found' })
    @ApiResponse({ status: 500, description: 'Internal error.' })
    findAll(
      @Query('pagination') paginationDto: PaginationDto,
      @Query('company') companyId: string,
      @Query('role') role: string,
      @GetUser() user: User,
    ) {
      return this.usersService.findUsers(paginationDto, role, companyId, user);
    }

    @Patch(':id')
    @Auth(
      ValidRoles.Root,
      ValidRoles.Administrator,
      ValidRoles.CompanyOwner,
      ValidRoles.CompanyAdmin
    )
    @ApiResponse({ status: 200, description: 'User updated', type: User })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Not found' })
    @ApiResponse({ status: 500, description: 'Internal error.' })
    update(
      @Ip() clientIp: string,
      @Param('id', ParseMongoIdPipe) id: string,
      @Body() updateUserDto: UpdateUserDto,
      @GetUser() user: User
    ) {

      const { role } = updateUserDto;

      switch (role) {
        case 'companyClient': return this.usersCompanyClientsService.update(id, updateUserDto, user, clientIp)
        case 'companyAdmin': return this.usersCompanyAdministratorsService.update(id, updateUserDto, user, clientIp)
        case 'companySupervisor': return this.usersCompanySupervisorsService.update(id, updateUserDto, user, clientIp)
        case 'companyWorker': return this.usersCompanyWorkersService.update(id, updateUserDto, user, clientIp)
        default: return this.usersService.update(id, updateUserDto, user, clientIp)
      }
    }

    @Delete(':id')
    @Auth(
      ValidRoles.Root,
      ValidRoles.Administrator,
      ValidRoles.CompanyOwner,
      ValidRoles.CompanyAdmin
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
      return this.usersService.remove(id, user, clientIp);
    }
  
  // =====================
  // SYSTEM ADMINISTRATORS
  // =====================
  
  @Get('/administrators')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin
  )
  @ApiResponse({ status: 200, description: 'Users found', type: [User] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findSystemAdministrators(
    @Query('pagination') paginationDto: PaginationDto,
    @GetUser() user: User,
  ) {
    return this.usersService.findUsers(paginationDto, 'admin', null, user);
  }
  
  // ==============
  // COMPANY OWNERS 
  // ==============
  // ======================
  // COMPANY ADMINISTRATORS
  // ======================
  
  @Get('/company/administrators')
  @Auth(
    ValidRoles.CompanyOwner,
  )
  @ApiResponse({ status: 200, description: 'Users found', type: [User] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findCompanyAdministrators(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    // @GetUser() user: User,
  ) {
    return this.usersCompanyAdministratorsService.findUsers(paginationDto, companyId);
  }
  
  // ===================
  // COMPANY SUPERVISORS
  // ===================

  @Get('/company/supervisors')
  @Auth(
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
  )
  @ApiResponse({ status: 200, description: 'Users found', type: [User] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findCompanySupervisors(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    // @GetUser() user: User,
  ) {
    return this.usersCompanySupervisorsService.findUsers(paginationDto, companyId);
  }

  // ===============
  // COMPANY WORKERS
  // ===============

  @Get('/company/workers')
  @Auth(
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
    ValidRoles.CompanySupervisor,
  )
  @ApiResponse({ status: 200, description: 'Users found', type: [User] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findCompanyWorkers(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    // @GetUser() user: User,
  ) {
    return this.usersCompanyWorkersService.findUsers(paginationDto, companyId);
  }

  // ===============
  // COMPANY CLIENTS
  // ===============

  @Get('/company/clients')
  @Auth(
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
    ValidRoles.CompanySupervisor,
    ValidRoles.companyWorker,
  )
  @ApiResponse({ status: 200, description: 'Users found', type: [User] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findCompanyClients(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    // @GetUser() user: User,
  ) {
    return this.usersCompanyClientsService.findUsers(paginationDto, companyId);
  }

  // ==============
  // SYSTEM CLIENTS
  // ==============

  @Get('/clients')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
  )
  @ApiResponse({ status: 200, description: 'Users found', type: [User] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findClients(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') companyId: string,
    @GetUser() user: User,
  ) {
    return this.usersService.findUsers(paginationDto, 'companyOwner', companyId, user);
  }

  // TODO ARE NECESSARY ?

  @Get(':search')
  @Auth()
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('search') search: string
  ) {
    return this.usersService.findOne(search);
  }
  
  @Get('/exist/:search')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin
  )
  @ApiResponse({ status: 200, description: 'User exist', type: Boolean })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  clientExist(
    @Param('search') search: string
  ) {
    return this.usersService.clientExist(search);
  }

  @Post('reset-password')
  @Auth()
  @ApiResponse({ status: 200, description: 'User password reset.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  resetPassword(
    @Ip() clientIp: string,
    @Body() data: any,
    @GetUser() user: User
  ) {
    const { id } = data
    return this.usersService.resetPassword(id, user, clientIp)
  }

  @Post('reactivate')
  @Auth()
  @ApiResponse({ status: 200, description: 'User password reset.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  reactivate(
    @Ip() clientIp: string,
    @Body() data: any,
    @GetUser() user: User
  ) {
    const { id } = data
    return this.usersService.reactivate(id, user, clientIp)
  }
}
