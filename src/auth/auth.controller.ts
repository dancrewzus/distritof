import { Controller, Post, Body, Get, Ip, Query, BadRequestException } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'

import { User } from 'src/functionalities/users/entities/user.entity'
import { ErrorResponseDto } from 'src/common/dto/error-response.dto'
import { GetUser } from './decorators/get-user.decorator'
import { Auth } from './decorators/auth.decorator'
import { RegisterDto } from './dto/register.dto'
import { ChangePasswordDto } from './dto/password.dto'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { ValidRoles } from './interfaces/valid-roles'
import { ValidateEmailDto } from './dto/validate-email.dto'
import { PasswordRecoveryDto } from './dto/password-recovery.dto'
import { error } from 'src/common/constants/error-messages'

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @ApiResponse({ status: 200, description: 'User logged.' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials. Email or password are invalid.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  adminLogin(
    @Ip() clientIp: string,
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.adminLogin(loginDto, clientIp)
  }

  @Post('client-login')
  @ApiResponse({ status: 200, description: 'User logged.' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials. Email or password are invalid.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  clientLogin(
    @Ip() clientIp: string,
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.clientLogin(loginDto, clientIp)
  }
  
  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered.' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Not found exception. Primary role not found.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  register(
    @Ip() clientIp: string,
    @Body() registerUserDto: RegisterDto
  ) {
    return this.authService.register(registerUserDto, clientIp)
  }

  @Post('change-password')
  @ApiResponse({ status: 200, description: 'Password changed.' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials. Email or password are invalid.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  changePassword(
    @Ip() clientIp: string,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.authService.changePassword(changePasswordDto, clientIp)
  }
  
  @Post('validate-email')
  @ApiResponse({ status: 200, description: 'Password changed.' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials. Email or password are invalid.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  emailValidation(
    @Ip() clientIp: string,
    @Body() validateEmail: ValidateEmailDto
  ) {
    const { id, validationCode } = validateEmail
    return this.authService.emailValidation(id, validationCode, clientIp)
  }
  
  @Post('password-recovery')
  @ApiResponse({ status: 200, description: 'Request for reset password sended.' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials. Email or password are invalid.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  resetPassword(
    @Ip() clientIp: string,
    @Body() passwordDto: PasswordRecoveryDto
  ) {
    return this.authService.passwordRecovery(passwordDto, clientIp)
  }

  @Get('check-status')
  @Auth()
  @ApiResponse({ status: 200, description: 'Check user status' })
  @ApiResponse({ status: 400, description: 'Bad request. Email or password not satisfied some conditions.', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials. Email or password are invalid.', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal error.', type: ErrorResponseDto })
  checkAthStatus(
    @Ip() clientIp: string,
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus(user, clientIp)
  }

  @Get('private-test')
  @Auth(ValidRoles.Root, ValidRoles.Administrator)
  testPrivateRoute(
    @Ip() clientIp: string,
    @GetUser() user: User
  ) {
    return {
      message: "It's leviousa!",
      ip: clientIp,
      user,
    }
  }
}
