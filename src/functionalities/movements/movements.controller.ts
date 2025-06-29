import { Controller, Get, Post, Body, Param, HttpCode, Query, Ip } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { User } from 'src/functionalities/users/entities/user.entity'
import { GetUser } from 'src/auth/decorators/get-user.decorator'
import { PaginationDto } from 'src/common/dto/pagination.dto'
import { CreateMovementDto } from './dto/create-movement.dto'
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { MovementsService } from './movements.service'
import { Movement } from './entities/movement.entity'

@ApiTags('Movements')
@Controller('movements')
@Auth()
export class MovementsController {
  
  constructor(private readonly movementsService: MovementsService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiResponse({ status: 201, description: 'Contract created', type: Movement })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @Body() createMovementDto: CreateMovementDto,
    @GetUser() userRequest: User
  ) {
    return this.movementsService.create(createMovementDto, userRequest, clientIp);
  }

  @Get('pending')
  @HttpCode(200)
  @Auth(ValidRoles.Root, ValidRoles.Administrator, ValidRoles.CompanyOwner, ValidRoles.CompanyAdmin, ValidRoles.CompanySupervisor, ValidRoles.companyWorker)
  @ApiResponse({ status: 200, description: 'Daily resume data' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  pending(
    @Query('pagination') paginationDto: PaginationDto,
    @Query('company') company: string,
    @GetUser() userRequest: User
  ) {
    return this.movementsService.pending(paginationDto, userRequest, company);
  }
  
  @Post('handle-movement')
  @HttpCode(200)
  @Auth(ValidRoles.Root, ValidRoles.Administrator, ValidRoles.CompanyOwner, ValidRoles.CompanyAdmin, ValidRoles.CompanySupervisor)
  @ApiResponse({ status: 200, description: 'Contract created', type: Movement })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  handleMovement(
    @Ip() clientIp: string,
    @Body() movementData: any,
    @GetUser() userRequest: User
  ) {

    const { action, company, movement } = movementData
    return action === 'validate' 
      ? this.movementsService.validateMovement(movement, company, userRequest, clientIp)
      : this.movementsService.cancelMovement(movement, company, userRequest, clientIp)
  }

    @Get('resume')
    @HttpCode(200)
    @Auth()
    @ApiResponse({ status: 200, description: 'Daily resume data' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 422, description: 'Unprocessable entity' })
    @ApiResponse({ status: 500, description: 'Internal error' })
    getResume(
      @Query('company') selectedCompany: string,
      @Query('worker') selectedWorker: string,
      @Query('screen') selectedScreen: string,
      @Query('route') selectedRoute: string,
      @GetUser() userRequest: User
    ) {
      const isDashboard = selectedScreen === 'dashboard';
      return this.movementsService.getResume({ selectedCompany, selectedWorker, selectedRoute }, userRequest, isDashboard);
    }

  // @Get('from-today/:type')
  // @HttpCode(200)
  // @Auth()
  // @ApiResponse({ status: 200, description: 'Daily resume data' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  // @ApiResponse({ status: 500, description: 'Internal error' })
  // movementsFromToday(
  //   @Param('type') type: string,
  //   @GetUser() user: User
  // ) {
  //   return this.movementsService.movementsFromToday(type, user);
  // }
  
  // @Get('daily-resume-dashboard/:id')
  // @HttpCode(200)
  // @Auth()
  // @ApiResponse({ status: 200, description: 'Daily resume data' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  // @ApiResponse({ status: 500, description: 'Internal error' })
  // dailyResumeDashboard(
  //   @Param('id') id: string,
  //   @GetUser() user: User
  // ) {
  //   return this.movementsService.dailyResumeDashboard(id, user);
  // }
  
  // @Get('delete-comment/:id')
  // @HttpCode(200)
  // @Auth()
  // @ApiResponse({ status: 200, description: 'Daily resume data' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  // @ApiResponse({ status: 500, description: 'Internal error' })
  // deleteComment(
  //   @Param('id') id: string,
  //   @GetUser() user: User
  // ) {
  //   return this.movementsService.deleteComment(id, user);
  // }
  
  // @Get('pending-count')
  // @HttpCode(200)
  // @Auth()
  // @ApiResponse({ status: 200, description: 'Daily resume data' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 401, description: 'Unauthorized' })
  // @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  // @ApiResponse({ status: 500, description: 'Internal error' })
  // pendingCount(
  //   @GetUser() user: User
  // ) {
  //   return this.movementsService.pendingCount(user);
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.movementsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMovementDto: UpdateMovementDto) {
  //   return this.movementsService.update(+id, updateMovementDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.movementsService.remove(+id);
  // }
}
