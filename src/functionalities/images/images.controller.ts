import { Controller, Post, Body, HttpCode, Ip, Get, Param, Query, Delete } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'

import { GetUser } from 'src/auth/decorators/get-user.decorator'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { User } from '../users/entities/user.entity' 
import { Image } from './entities/image.entity' 

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe'
import { PaginationDto } from 'src/common/dto/pagination.dto'
import { ValidRoles } from 'src/auth/interfaces/valid-roles'
import { CreateImageDto } from './dto/create-image.dto'
import { ImagesService } from './images.service'

@ApiTags('Images')
@Controller('images')
@Auth()
export class ImagesController {

  constructor(private readonly imageService: ImagesService) {}

  @Post()
  @HttpCode(201)
  @Auth()
  @ApiResponse({ status: 201, description: 'Image created', type: Image })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Unprocessable entity' })
  @ApiResponse({ status: 500, description: 'Internal error' })
  create(
    @Ip() clientIp: string,
    @Body() createImageDto: CreateImageDto,
    @GetUser() user: User
  ) {
    return this.imageService.create(createImageDto, user, clientIp)
  }

  @Get()
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  @ApiResponse({ status: 200, description: 'Images found', type: [Image] })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findAll(
    @Query('pagination') paginationDto: PaginationDto,
  ) {
    return this.imageService.findMany(paginationDto);
  }

  @Get(':id')
  @Auth()
  @ApiResponse({ status: 200, description: 'Image found', type: Image })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  findOne(
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.imageService.findOne(id);
  }

  @Delete(':id')
  @Auth(
    ValidRoles.Root,
    ValidRoles.Administrator,
    ValidRoles.CompanyOwner,
    ValidRoles.CompanyAdmin,
    ValidRoles.companyWorker,
  )
  @ApiResponse({ status: 200, description: 'Soft delete image.' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 500, description: 'Internal error.' })
  remove(
    @Ip() clientIp: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @GetUser() user: User
  ) {
    return this.imageService.remove(id, user, clientIp);
  }
}
