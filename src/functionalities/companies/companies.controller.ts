import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CreateCompanyDto, UpdateCompanyDto } from './dto';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { User } from '../users/entities/user.entity';
import { AssignLicenseDto } from './dto/assign-license.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {

  constructor(
    private readonly companiesService: CompaniesService
  ) {}

  @Post()
  @HttpCode(201)
  @Auth(ValidRoles.CompanyOwner)
  @ApiResponse({ status: 201, description: 'Company created', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() createCompanyDto: CreateCompanyDto,
  ) {
    return this.companiesService.create(createCompanyDto, user, clientIp);
  }

  @Get()
  @Auth(ValidRoles.Root, ValidRoles.Administrator, ValidRoles.CompanyOwner)
  @ApiResponse({ status: 200, description: 'Companies found', type: [Company] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
    @GetUser() user: User,
  ) {
    return this.companiesService.findMany(paginationDto, user);
  }

  @Get('/update')
  @Auth()
  @ApiResponse({ status: 200, description: 'Companies found', type: [Company] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  updateClientData(
    @GetUser() user: User,
  ) {
    return this.companiesService.updateClientData(user);
  }

  @Get('/find/:id')
  @Auth(ValidRoles.Root, ValidRoles.Administrator, ValidRoles.CompanyOwner, ValidRoles.CompanyAdmin, ValidRoles.companyWorker)
  @ApiResponse({ status: 200, description: 'Company found', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.CompanyOwner)
  @ApiResponse({ status: 200, description: 'Company updated', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  update(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @GetUser() user: User
  ) {
    return this.companiesService.update(id, updateCompanyDto, user, clientIp);
  }

  @Delete(':id')
  @Auth(ValidRoles.CompanyOwner)
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
    return this.companiesService.remove(id, user, clientIp);
  }

  @Post()
  @HttpCode(201)
  @Auth(ValidRoles.CompanyOwner)
  @ApiResponse({ status: 201, description: 'Company created', type: Company })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  assignLicense(
    @Ip() clientIp: string,
    @GetUser() user: User,
    @Body() assignLicenseDto: AssignLicenseDto,
  ) {
    return this.companiesService.assignLicense(assignLicenseDto, user, clientIp);
  }
}
