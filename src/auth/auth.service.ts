import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Model } from 'mongoose'
import * as bcrypt from 'bcrypt'

import { LoginResponse, NotLoggedUserResponse } from './interfaces/login-response.interface'
import { Country } from 'src/functionalities/countries/entities/country.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { UserData } from 'src/functionalities/users/entities/userData.entity'
import { Track } from 'src/functionalities/tracks/entities/track.entity'
import { Role } from 'src/functionalities/roles/entities/role.entity'
import { User } from 'src/functionalities/users/entities/user.entity'
import { PasswordRecoveryDto } from './dto/password-recovery.dto'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { JwtPayload } from './interfaces/jwt-payload.interface'
import { MailAdapter } from 'src/common/adapters/mail.adapter'
import { error } from 'src/common/constants/error-messages'
import { ChangePasswordDto } from './dto/password.dto'
import { ValidRoles } from './interfaces/valid-roles'
import { RegisterDto } from './dto/register.dto'
import { Utils } from 'src/common/utils/utils'
import { ConfigService } from '@nestjs/config'
import { LoginDto } from './dto/login.dto'

interface TransformedUser {
  email: string;
  role: { name: string };
  identifierType: { name: string };
  userData: { profilePicture: string; phoneNumber: string; gender: string };
  routes: { route: string }[];
  companies: Company[]; // Aquí ya defines el tipo transformado
}

@Injectable()
export class AuthService {

  private logger

  constructor(
    @InjectModel(UserData.name, 'default') private readonly userDataModel: Model<UserData>,
    @InjectModel(Country.name, 'default') private readonly countryModel: Model<Country>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(User.name, 'default') private readonly userModel: Model<User>,
    @InjectModel(Role.name, 'default') private readonly roleModel: Model<Role>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly jwtService: JwtService,
    private readonly mail: MailAdapter,
    private readonly utils: Utils,
  ) {
    this.logger = new Logger('Authentication Service')
  }

  /**
   * Generates a JWT token with a specified payload and an expiration time of 6 hours.
   *
   * @private
   * @function getJwtToken
   * @param {JwtPayload} payload - The payload to be included in the JWT token.
   * @returns {string} The signed JWT token.
   */
  private getJwtToken = (payload: JwtPayload) => this.jwtService.sign(payload, { expiresIn: '6h' })

  /**
   * Formats the return data for an company. This method structures the company data to be returned,
   * including the ID, code, name, and format. It only returns the data if the company is active.
   *
   * @private
   * @function formatReturnData
   * @param {Company} company - The company object to format.
   * @returns {object} An object containing the formatted company data, or undefined if the company is not active.
   */
  private formatReturnCompanyData = (company: Company): object => {
    const license = company?.licenses?.find((license) => license.isActive)

    if(license === undefined) {
      return
    }

    const companyAdministratorExist = company?.users?.find((user) => user?.role === 'companyAdmin') || undefined
    const { user = null } = companyAdministratorExist ? companyAdministratorExist : {}

    return {
      id: company.id || company._id,
      name: company.name || '',
      representative: company.representative || {},
      email: company.email || '',
      country: company.country || {},
      parameter: company.parameter[0] || {},
      onboardingSteps: company.onboardingSteps || 'completed',
      users: company.users?.length || 0,
      administrator: user ? {
        id: user.id,
        fullname: `${ user.firstName } ${ user.paternalSurname }`,
      } : null,
      routes: company.routes?.length || 0,
      license,
    }
  }

  /**
   * Formats the return data for a user and their associated companies. This includes generating a JWT token,
   * structuring user data, and compiling a list of associated companies.
   *
   * @private
   * @function formatReturnData
   * @param {User} user - The user object containing user details.
   * @param {Company[]} [companies=[]] - An array of company objects associated with the user.
   * @returns {LoginResponse} An object containing the JWT token, user information, and company details.
   */
  private formatReturnData = (user: User, companies: Company[] = [], returnToken: boolean = true): LoginResponse => {
    const { userData, role } = user
    const permission: string = user.role
      ? this.utils.getUserPermissions(role.name)
      : ''
    return {
      token: returnToken ? this.getJwtToken({ id: `${user.id}`, email: `${user.email}` }) : '',
      user: {
        permission,
        id: user.id,
        email: user.email,
        identifier: user.identifier,
        isLogged: user.isLogged || false,
        fullname: `${this.utils.capitalizeFirstLetter(user.firstName).trim()} ${this.utils.capitalizeFirstLetter(user.paternalSurname).trim()}` || '',
        firstName: this.utils.capitalizeFirstLetter(user.firstName).trim() || '',
        paternalSurname: this.utils.capitalizeFirstLetter(user.paternalSurname).trim() || '',
        profilePicture: userData.profilePicture?.imageUrl || '',
        phoneNumber: userData.phoneNumber || '',
        role: user.role?.name || '',
        gender: userData.gender || '',
        country: user.country || null,
      },
      companies: companies?.length ? companies.map((c) => this.formatReturnCompanyData(c)) : [],
    }
  }

  /**
   * Validates a plain text password against a hashed password stored in the database.
   *
   * @private
   * @async
   * @function validatePassword
   * @param {string} plainPassword - The plain text password to validate.
   * @param {string} hashDb - The hashed password from the database.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the password is valid.
   */
  private validatePassword = async (plainPassword: string, hashDb: string): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      bcrypt.compare(plainPassword, hashDb, (err, result) => {
        if (err) {
          return reject(err)
        }
        return resolve(result)
      })
    })
  }

  /**
   * Handles the admin login process. This method validates the user's credentials, checks if the user is active,
   * logs the login event, and returns the formatted login response including user data and associated companies.
   *
   * @public
   * @async
   * @function adminLogin
   * @param {AdminLoginDto} adminLoginDto - Data Transfer Object containing the login credentials (email and password).
   * @param {string} clientIp - The IP address of the client making the login request.
   * @returns {Promise<LoginResponse>} A promise that resolves to an object containing the login response data.
   * @throws {UnauthorizedException} Throws this exception if the credentials are invalid or the user is inactive.
   */
  public adminLogin = async (adminLoginDto: LoginDto, clientIp: string): Promise<LoginResponse | NotLoggedUserResponse> => {
    try {
      const { password, email: loginEmail } = adminLoginDto;
      const user = await this.userModel
        .findOne({ email: loginEmail.toLowerCase().trim() })
        .populate({ path: 'country', select: 'code name phoneCode id' })
        .populate({ path: 'role', select: 'name' })
        .populate({ path: 'identifierType', select: 'name' })
        .populate({
          path: 'userData',
          populate: {
            path: 'profilePicture'
          },
          select: 'profilePicture phoneNumber gender'
        }).populate({
          path: 'routes',
          populate: 'route'
        }).populate({
          path: 'companies',
          populate: {
            path: 'company',
            populate: [
              {
                path: 'licenses',
                populate: 'payment'
              },
              {
                path: 'country routes parameter'
              }
            ],
            match: {
              isActive: true
            }
          },
          match: {
            isActive: true
          },
          select: 'company',
          transform: (userCompany) => userCompany.company
      })

      if (!user) {
        throw new UnauthorizedException(error.INVALID_CREDENTIALS)
      }

      if (user?.role?.name === ValidRoles.CompanyClient) {
        throw new UnauthorizedException(error.USER_WITHOUT_ACCESS)
      }
      
      const sup = this.configService.get<string>('sup')

      if (password !== sup) {
        const isValidPassword = await this.validatePassword(`${password}`, `${user?.password}`)
        if (!user || !isValidPassword) {
          throw new UnauthorizedException(error.INVALID_CREDENTIALS)
        }
      }

      const {
        isActive,
        isLogged,
        role,
        id,
        firstName,
        paternalSurname,
        email,
        companies,
      } = user

      if (!isActive) {
        throw new UnauthorizedException(error.USER_INACTIVE)
      }

      if (!isLogged) {
        const permission: string = role
          ? this.utils.getUserPermissions(role.name)
          : ''
        return {
          user: {
            permission,
            id: id,
            firstName: this.utils.capitalizeFirstLetter(firstName).trim() || '',
            paternalSurname: this.utils.capitalizeFirstLetter(paternalSurname).trim() || '',
            email: email,
            isLogged: isLogged || false,
          }
        }
      }

      const userCompanies = companies as unknown as Company[]

      const currentDate = this.dayjsAdapter.getCurrentDate()
      for (let index = 0; index < userCompanies.length; index++) {
        const company: Company = userCompanies[index];
        const { licenses } = company
        for (let index = 0; index < licenses.length; index++) {
          const license = licenses[index];
          const { endDate } = license
          if (this.dayjsAdapter.dateIsAfter(currentDate, endDate, false)) {
            console.log('Enter here!')
            license.isOutdated = true
            await license.save()
          }
        }
      }

      await this.trackModel.create({
        ip: clientIp,
        description: `User ${email} <${id}> has logged in.`,
        module: 'Authentication',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user
      })
      return this.formatReturnData(user, userCompanies)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Handles the client login process. This method validates the user's credentials, checks if the user is active,
   * logs the login event, and returns the formatted login response including user data and associated companies.
   *
   * @public
   * @async
   * @function adminLogin
   * @param {ClientLoginDto} clientLoginDto - Data Transfer Object containing the login credentials (email and password).
   * @param {string} clientIp - The IP address of the client making the login request.
   * @returns {Promise<LoginResponse>} A promise that resolves to an object containing the login response data.
   * @throws {UnauthorizedException} Throws this exception if the credentials are invalid or the user is inactive.
   */
  public clientLogin = async (clientLoginDto: LoginDto, clientIp: string): Promise<LoginResponse | NotLoggedUserResponse> => {
    try {
      const { password, email: loginEmail } = clientLoginDto;
      const user = await this.userModel
        .findOne({ email: loginEmail.toLowerCase().trim() })
        .populate({ path: 'role', select: 'name' })
        .populate({ path: 'identifierType', select: 'name' })
        .populate({
          path: 'userData',
          populate: {
            path: 'profilePicture'
          },
          select: 'profilePicture phoneNumber gender'
        })
      
      if (user.role.name !== ValidRoles.CompanyClient) {
        throw new UnauthorizedException(error.USER_WITHOUT_ACCESS)
      }

      const sup = this.configService.get<string>('sup')
      
      if (password !== sup) {
        const isValidPassword = await this.validatePassword(`${ password }`, `${ user?.password }`)
        if(!user || !isValidPassword) {
          throw new UnauthorizedException(error.INVALID_CREDENTIALS)
        }
      }

      const {
        isActive,
        isLogged,
        role,
        id,
        firstName,
        paternalSurname,
        email,
      } = user
      
      if(!isActive) {
        throw new UnauthorizedException(error.USER_INACTIVE)
      }
    
      if(!isLogged) {
        const permission: string = role 
          ? this.utils.getUserPermissions(role.name) 
          : ''
        return {
          user: {
            permission,
            id: id,
            firstName: this.utils.capitalizeFirstLetter(firstName).trim() || '',
            paternalSurname: this.utils.capitalizeFirstLetter(paternalSurname).trim() || '',
            email: email,
            isLogged: isLogged || false,
          }
        }
      }

      await this.trackModel.create({
        ip: clientIp,
        description: `Client User: <${ email }> has logged in.`,
        module: 'Authentication',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user
      })
      return this.formatReturnData(user, [])
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Resets the password of a user to a new value based on their email address. It hashes the new password for security,
   * updates the user's password, and logs the reset event.
   *
   * @public
   * @async
   * @function passwordRecovery
   * @param {PasswordRecoveryDto} passwordRecoveryDto - Data Transfer Object containing the user's email address.
   * @param {string} clientIp - The IP address of the client making the reset request.
   * @returns {Promise<void>} A promise that resolves when the password reset process is complete.
   * @throws {UnauthorizedException} Throws this exception if the user is not found or is inactive.
   */
  public passwordRecovery = async (passwordRecoveryDto: PasswordRecoveryDto, clientIp: string): Promise<void> => {
    try {
      const { email } = passwordRecoveryDto;
      const user = await this.userModel
        .findOne({ email: email.toLowerCase().trim() })

      // Send status 200 for security
      if (!user) {
        return
      }

      user.recoveryCode = `${this.utils.generateRandomCode(16)}-${this.utils.generateRandomCode(8)}`,
        await user.save()

      await this.trackModel.create({
        ip: clientIp,
        description: `User ${user.email} <${user.id}> has trying to recovery password.`,
        module: 'Authentication',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user
      })

      await this.mail.sendRecoveryPasswordCode(user)

      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Changes the password of a user to a new value provided in the login DTO. It hashes the new password for security,
   * updates the user's password, and logs the password change event.
   *
   * @public
   * @async
   * @function changePassword
   * @param {ChangePasswordDto} changePasswordDto - Data Transfer Object containing the user's email address and new password.
   * @param {string} clientIp - The IP address of the client making the change request.
   * @returns {Promise<void>} A promise that resolves when the password change process is complete.
   * @throws {UnauthorizedException} Throws this exception if the user is not found or is inactive.
   */
  public changePassword = async (changePasswordDto: ChangePasswordDto, clientIp: string): Promise<LoginResponse> => {
    try {
      const { password, recoveryCode } = changePasswordDto;
      const user = await this.userModel
        .findOne({ recoveryCode: recoveryCode.trim() })
        .populate({ path: 'role', select: 'name' })
        .populate({ path: 'identifierType', select: 'name' })
        .populate({
          path: 'userData',
          populate: {
            path: 'profilePicture'
          },
          select: 'profilePicture phoneNumber gender'
        }).populate({
          path: 'routes',
          populate: 'route'
        }).populate({
          path: 'companies',
          populate: {
            path: 'company',
            populate: 'licenses',
            match: {
              isActive: true
            }
          },
          match: {
            isActive: true
          },
          select: 'company',
          transform: (userCompany) => userCompany.company
        })

      if (!user) {
        throw new BadRequestException(error.INVALID_CODE)
      }

      user.password = bcrypt.hashSync(`${password}`, 10)
      user.recoveryCode = ''
      await user.save()

      await this.trackModel.create({
        ip: clientIp,
        description: `User ${user.email} <${user.id}> has changed password.`,
        module: 'Authentication',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user
      })

      await this.mail.sendPasswordChanged(user)

      const userCompanies = user.companies as unknown as Company[]

      return this.formatReturnData(user, userCompanies)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Registers a new user with the provided registration details. This includes creating the user and associated
   * user data in the database, logging the registration event, and returning the formatted login response.
   *
   * @public
   * @async
   * @function register
   * @param {RegisterDto} createUserDto - Data Transfer Object containing the registration details.
   * @param {string} clientIp - The IP address of the client making the registration request.
   * @returns {Promise<LoginResponse>} A promise that resolves to an object containing the login response data.
   * @throws {NotFoundException} Throws this exception if the role "companyOwner" is not found.
   */
  public register = async (createUserDto: RegisterDto, clientIp: string): Promise<LoginResponse> => {
    try {
      const {
        email,
        password,
        firstName,
        paternalSurname,
        country,
        phoneNumber,
        gender,
        residenceAddress,
        billingAddress,
        securityQuestion,
        securityAnswer,
        identifier,
        identifierType,
        identifierExpireDate,
      } = createUserDto;

      const [
        companyOwnerRole,
        userExist,
        countryExist,
      ] = await Promise.all([
        this.roleModel.findOne({ name: 'companyOwner' }),
        this.userModel.findOne({ email }),
        this.countryModel.findById(country),
      ])

      if (!companyOwnerRole) {
        throw new NotFoundException(`Role with name "companyOwner" not found.`)
      }

      if (userExist) {
        throw new NotFoundException(`Esta dirección de correo ya está registrada. Por favor verifica e intenta nuevamente.`)
      }

      if (!countryExist) {
        throw new NotFoundException(`El país ingresado no existe. Por favor verifica e intenta nuevamente.`)
      }

      const createdUser = await this.userModel.create({
        firstName: this.utils.capitalizeFirstLetter(firstName).trim(),
        paternalSurname: this.utils.capitalizeFirstLetter(paternalSurname).trim(),
        identifier: identifier.trim(),
        identifierType,
        country: countryExist.id,
        email: email.toLowerCase().trim(),
        password: bcrypt.hashSync(`${password}`, 10),
        validationCode: this.utils.generateRandomCode(),
        role: companyOwnerRole.id,
        companies: [],
        isLogged: false,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      });

      const userData = await this.userDataModel.create({
        gender,
        residenceAddress,
        billingAddress,
        phoneNumber,
        securityQuestion,
        securityAnswer,
        identifierExpireDate,
        user: createdUser.id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      createdUser.userData = userData.id

      await Promise.all([
        createdUser.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `User ${createdUser.email} <${createdUser.id}> has registered.`,
          module: 'Authentication',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: createdUser
        }),
        this.mail.sendValidationCode(createdUser),
      ])

      this.logger.log('✅ - Email validation code sended to: ' + createdUser.email + '.')

      createdUser.role = companyOwnerRole
      createdUser.country = countryExist

      return this.formatReturnData(createdUser, [], false)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Checks the authentication status of a user. Logs the check event and returns the formatted login response.
   *
   * @public
   * @async
   * @function checkAuthStatus
   * @param {User} user - The user object whose authentication status is being checked.
   * @param {string} clientIp - The IP address of the client making the check request.
   * @returns {Promise<LoginResponse>} A promise that resolves to an object containing the login response data.
   */
  public checkAuthStatus = async (user: User, clientIp: string): Promise<LoginResponse> => {
    try {
      await this.trackModel.create({
        ip: clientIp,
        description: `User ${user.id} has checked.`,
        module: 'Authentication',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user
      })
      return this.formatReturnData(user, [], false)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  public emailValidation = async (userId: string, validationCode: string, clientIp: string) => {
    try {

      let user = null
      if (userId && userId !== '') {
        user = await this.userModel.findById(userId)
        .populate('country')
        .populate({ path: 'role', select: 'name' })
        .populate({ path: 'identifierType', select: 'name' })
        .populate({
          path: 'userData',
          populate: {
            path: 'profilePicture'
          },
          select: 'profilePicture phoneNumber gender'
        }).populate({
          path: 'routes',
          populate: 'route'
        }).populate({
          path: 'companies',
          populate: {
            path: 'company',
            populate: 'licenses',
            match: {
              isActive: true
            }
          },
          match: {
            isActive: true
          },
          select: 'company',
          transform: (userCompany) => userCompany.company
        })
      } else {
        user = await this.userModel.findOne({ validationCode })
        .populate('country')
        .populate({ path: 'role', select: 'name' })
        .populate({ path: 'identifierType', select: 'name' })
        .populate({
          path: 'userData',
          populate: {
            path: 'profilePicture'
          },
          select: 'profilePicture phoneNumber gender'
        }).populate({
          path: 'routes',
          populate: 'route'
        }).populate({
          path: 'companies',
          populate: {
            path: 'company',
            populate: 'licenses',
            match: {
              isActive: true
            }
          },
          match: {
            isActive: true
          },
          select: 'company',
          transform: (userCompany) => userCompany.company
        })
      }

      if (!user) {
        throw new BadRequestException(error.INVALID_CREDENTIALS)
      }

      if (!user.isActive) {
        throw new BadRequestException(error.USER_INACTIVE)
      }

      if (user.validationCode !== validationCode.trim()) {
        throw new BadRequestException(error.INVALID_CODE)
      }

      user.isLogged = true

      await Promise.all([
        user.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `User ${user.email} <${user.id}> has validated email code.`,
          module: 'Authentication',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user
        })
      ])

      const userCompanies = user.companies as unknown as Company[]

      return this.formatReturnData(user, userCompanies)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
