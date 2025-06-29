import { BadRequestException, ConflictException, Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import * as bcrypt from 'bcrypt'

import { UserCompany } from '../users/entities/userCompany.entity'
import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { CompanyLicense } from './entities/company-license.entity'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Country } from '../countries/entities/country.entity'
import { License } from '../licenses/entities/license.entity'
import { UserData } from '../users/entities/userData.entity'
import { error } from 'src/common/constants/error-messages'
import { AssignLicenseDto } from './dto/assign-license.dto'
import { CreateCompanyDto, UpdateCompanyDto } from './dto'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Company } from './entities/company.entity'
import { Utils } from 'src/common/utils/utils'
import { Role } from '../roles/entities/role.entity'
import { Parameter } from '../parameters/entities/parameter.entity'
import { City } from '../cities/entities/city.entity'

@Injectable()
export class CompaniesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(CompanyLicense.name, 'default') private readonly companyLicenseModel: Model<CompanyLicense>,
    @InjectModel(Parameter.name, 'default') private readonly parameterModel: PaginateModel<Parameter>,
    @InjectModel(UserCompany.name, 'default') private readonly userCompanyModel: Model<UserCompany>,
    @InjectModel(Company.name, 'default') private readonly companyModel: PaginateModel<Company>,
    @InjectModel(UserData.name, 'default') private readonly userDataModel: Model<UserData>,
    @InjectModel(Country.name, 'default') private readonly countryModel: Model<Country>,
    @InjectModel(License.name, 'default') private readonly licenseModel: Model<License>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    @InjectModel(User.name, 'default') private readonly userModel: Model<User>,
    @InjectModel(Role.name, 'default') private readonly roleModel: Model<Role>,
    @InjectModel(City.name, 'default') private readonly cityModel: Model<City>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, isAdmin: boolean, userRequest: User): any {
    const baseQuery = { deleted: false };
    if (!isAdmin) {
      baseQuery['isActive'] = true;
    }
    
    baseQuery['representative'] = userRequest?.id;
  
    if (filter) {
      return {
        ...baseQuery,
        $or: [
          { email: new RegExp(filter, 'i') },
          { name: new RegExp(filter, 'i') },
          { contactEmail: new RegExp(filter, 'i') },
        ],
      };
    }
  
    return baseQuery;
  }
  
  private buildOptions(offset: number, limit: number, isAdmin: boolean): PaginateOptions {
    const options: PaginateOptions = {
      offset,
      limit,
      sort: { 
        createdAt: 1,
        isActive: -1,
        name: 1
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [
        { path: 'country' },
        { path: 'licenses' },
        { 
          path: 'users',
          populate: {
            path: 'user',
          }
        },
        { path: 'routes' },
      ]
    };

    return options;
  }

  /**
   * Finds an company by its ID. This method searches for the company in the database using its ID.
   * If the company is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findCompany
   * @param {string} id - The ID of the company to find.
   * @returns {Promise<Company>} A promise that resolves to the company object if found.
   * @throws {NotFoundException} Throws this exception if the company with the specified ID is not found.
   */
  private findCompany = async (id: string): Promise<Company> => {
    try {
      const company = await this.companyModel.findById(id).populate('country')

      if(!company) {
        throw new NotFoundException(`Company with ID "${ id }" not found`)
      }
      return company
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an company. This method structures the company data to be returned,
   * including the ID, code, name, and format. It only returns the data if the company is active.
   *
   * @private
   * @function formatReturnData
   * @param {Company} company - The company object to format.
   * @returns {object} An object containing the formatted company data, or undefined if the company is not active.
   */
  private formatReturnData = (company: Company): object => {
    const license = company.licenses.find((license) => license.isActive)

    if(!company.isActive || company.deleted) {
      return
    }

    const companyAdministratorExist = company.users.find((user) => user?.role === 'companyAdmin')
    const { user = null } = companyAdministratorExist ? companyAdministratorExist : {}

    return {
      id: company.id,
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
      license: license ? license : company.licenses[0],
    }
  }
  
  /**
   * Creates a new company. This method takes a DTO for creating an company, the user requesting the
   * creation, and the client's IP address. It saves the new company in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateCompanyDto} createCompanyDto - Data Transfer Object containing details for the new company.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created company.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createCompanyDto: CreateCompanyDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {

      const {
        name,
        email,
        contactEmail,
        country,
        // ...parameters TODO
      } = createCompanyDto

      const [
        userCompanyOwner,
        licenses,
        countryResponse,
        userCompaniesRelations,
        companyAdminRole
      ] = await Promise.all([
        this.userModel.findById(userRequest.id).populate('companies role userData'),
        this.licenseModel.find({
          isActive: true,
          deleted: false,
        }),
        this.countryModel.findById(country).populate('companies'),
        this.userCompanyModel.find({
          user: userRequest.id,
          isActive: true,  // Filtrar solo relaciones activas
        }).populate('company'),
        this.roleModel.findOne({ name: 'companyAdmin' }),
      ])

      if(!companyAdminRole) {
        throw new NotFoundException(error.ROLE_NOT_FOUND)
      }
      
      if(!userCompanyOwner) {
        throw new NotFoundException(error.USER_NOT_FOUND)
      }

      if(!licenses.length) {
        throw new NotFoundException(error.DOESNT_HAVE_ACTIVE_LICENSES)
      }

      if(!countryResponse) {
        throw new NotFoundException(error.COUNTRY_NOT_FOUND)
      }

      let companyLicense = null
      
      // Extraer las compañías desde las relaciones obtenidas
      const userCompanies = userCompaniesRelations
        .map(relation => relation.company)
        .filter(company => company.isActive && !company.deleted)

      if(!userCompanies.length) {
        companyLicense = licenses.find((license) => license.name.toLowerCase() === 'free')
      } else {
        companyLicense = licenses.find((license) => license.name.toLowerCase() === 'premium')

        const companyAlreadyExist = userCompanies.find((company) => company.name.toLowerCase() === name.toLowerCase())
        if(companyAlreadyExist !== undefined) {
          throw new ConflictException(error.COMPANY_ALREADY_EXIST)
        }
      }

      const createdCompany = await this.companyModel.create({
        name,
        representative: userCompanyOwner.id,
        email,
        contactEmail,
        onboardingSteps: '2',
        country: countryResponse.id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      });

      const startDate = this.dayjsAdapter.getCurrentDate()
      const endDate = this.dayjsAdapter.sumDaysToDate(startDate, companyLicense.days)
      const adminEmail = `owner.admin@${ createdCompany.name.trim().toLowerCase() }.com`

      const [
        createdLicense,
        createdUserCompany,
        createdUserAdmin,
        createdParameterCompany,
      ] = await Promise.all([
        this.companyLicenseModel.create({
          company: createdCompany.id,
          license: companyLicense.id,
          licenseName: companyLicense.name,
          startDate,
          endDate,
          payment: null,
          isActive: companyLicense.name.toLowerCase().includes('free') ? true : false,
          createdBy: userCompanyOwner.id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
        this.userCompanyModel.create({
          user: userCompanyOwner.id,
          company: createdCompany.id,
          role: userCompanyOwner.role.name,
          isActive: true,  // Relación activa
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
        this.userModel.create({
          firstName: this.utils.capitalizeFirstLetter(userCompanyOwner.firstName).trim(),
          paternalSurname: this.utils.capitalizeFirstLetter(userCompanyOwner.paternalSurname).trim(),
          identifier: userCompanyOwner.identifier,
          identifierType: userCompanyOwner.identifierType,
          country,
          email: adminEmail,
          password: bcrypt.hashSync(`${ adminEmail }`, 10),
          validationCode: this.utils.generateRandomCode(),
          role: companyAdminRole.id,
          companies: [],
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
        this.parameterModel.create({
          company: createdCompany.id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
      ])

      const [
        adminUserData,
        createdUserCompanyAdmin,
      ] = await Promise.all([
        this.userDataModel.create({
          gender: userCompanyOwner.userData.gender,
          residenceAddress: userCompanyOwner.userData.residenceAddress,
          billingAddress: userCompanyOwner.userData.billingAddress,
          phoneNumber: userCompanyOwner.userData.phoneNumber,
          securityQuestion: userCompanyOwner.userData.securityQuestion,
          securityAnswer: userCompanyOwner.userData.securityAnswer,
          identifierExpireDate: userCompanyOwner.userData.identifierExpireDate,
          user: createdUserAdmin.id,
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
        this.userCompanyModel.create({
          user: createdUserAdmin.id,
          company: createdCompany.id,
          role: companyAdminRole.name,
          isActive: true,  // Relación activa
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        }),
      ])

      createdUserAdmin.userData = adminUserData.id
      createdCompany.licenses.push(createdLicense.id)
      createdCompany.users.push(createdUserCompany.id)
      createdCompany.users.push(createdUserCompanyAdmin.id)
      createdCompany.parameter.push(createdParameterCompany.id)
      countryResponse.companies.push(createdCompany.id)
      userCompanyOwner.companies.push(createdUserCompany.id)
      createdUserAdmin.companies.push(createdUserCompanyAdmin.id)

      await Promise.all([
        createdCompany.save(),
        countryResponse.save(),
        userCompanyOwner.save(),
        createdUserAdmin.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Company ${ createdCompany.name } was created.`,
          module: 'Companies',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      ])

      createdCompany.country = countryResponse
      return this.formatReturnData(createdCompany)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple companies with pagination and optional filtering. This method retrieves companies
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of companies. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered companies.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    try {
      const query = this.buildQuery(filter, isAdmin, userRequest);
      const options = this.buildOptions(offset, limit, isAdmin);
      const companiesResponse = await this.companyModel.paginate(query, options)
      return {
        data: {
          pagination: companiesResponse?.pagination || {},
          companies: companiesResponse?.docs.map((company) => this.formatReturnData(company)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Finds multiple companies with pagination and optional filtering. This method retrieves companies
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of companies. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function updateClientData
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered companies.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public updateClientData = async (userRequest: User) => {
    try {
      const companiesResponse = await this.companyModel.find({ 
        isActive: true,
        deleted: false,
        representative: userRequest.id
      })
      .populate('country licenses routes parameter')
      .populate([
        { 
          path: 'users',
          populate: {
            path: 'user',
          }
        },
        { 
          path: 'licenses',
          populate: {
            path: 'payment',
          }
        }
      ])
      .sort({ name: 1 })
      return {
        data: {
          companies: companiesResponse?.map((company) => this.formatReturnData(company)).filter((company) => company !== null)
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single company by its ID. This method uses the findCompany method to retrieve the company
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the company to find.
   * @returns {Promise<object>} A promise that resolves to the formatted company data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const company = await this.findCompany(id)
      return this.formatReturnData(company)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing company. This method finds the company by its ID, updates it with the provided
   * data, logs the update event, and returns the updated company data. If the company is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the company to update.
   * @param {UpdateCompanyDto} updateCompanyDto - Data Transfer Object containing the updated details for the company.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated company data.
   * @throws {NotFoundException} Throws this exception if the company with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (id: string, updateCompanyDto: UpdateCompanyDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const company = await this.companyModel.findById(id)
      if(!company) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }
      await company.updateOne({
        ...updateCompanyDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })
      await this.trackModel.create({
        ip: clientIp,
        description: `Company ${ company.id } was updated: ${ JSON.stringify(updateCompanyDto) }.`,
        module: 'Companies',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return { ...company.toJSON(), ...updateCompanyDto }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an company by its ID. This method updates the company's status to inactive, logs the
   * deactivation event, and does not return any data. If the company is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the company to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the company with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User, clientIp: string) => {
    try {

      const companyResponse = await this.companyModel.findById(id)
        .populate('users cities licenses')
        .populate({
          path: 'representative',
          populate: {
            path: 'companies'
          }
        })
        .populate({
          path: 'routes',
          populate: {
            path: 'users'
          }
        })

      if(!companyResponse) {
        throw new NotFoundException(error.COMPANY_NOT_FOUND)
      }

      const { routes, representative } = companyResponse
      
      if(routes.length) {
        throw new BadRequestException(error.COMPANY_HAVE_ROUTES)
      }

      if(representative) {
        representative.companies = representative.companies.filter((c) => c._id !== companyResponse._id)
        await representative.save()
      }

      const userCompany = await this.userCompanyModel.find({ company: companyResponse.id }).populate({ path: 'user', populate: 'role userData'})
      const usersToDelete = userCompany.map((userCompany) => userCompany.user).filter((user) => user.role.name !== 'companyOwner')

      for (let index = 0; index < usersToDelete.length; index++) {
        const user = usersToDelete[index];
        const { userData } = user
        await Promise.all([
          user.deleteOne(),
          userData.deleteOne(),
        ])
      }
      
      await Promise.all([
        this.userCompanyModel.deleteMany({
          company: companyResponse.id,
        }),
        this.companyLicenseModel.deleteMany({
          company: companyResponse.id,
        }),
        this.cityModel.deleteMany({
          company: companyResponse.id,
        }),
        companyResponse.deleteOne(),
        // companyResponse.updateOne({ 
        //   isActive: false,
        //   deleted: true,
        //   updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        //   deletedAt: this.dayjsAdapter.getCurrentDateTime()
        // }),
        this.trackModel.create({
          ip: clientIp,
          description: `Company ${ companyResponse.id } was deactivated.`,
          module: 'Companies',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      ])
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Assigns a license to a company. This method finds the company and license by their IDs, creates a new company license,
   * updates the company's license list, and logs the license assignment event.
   *
   * @public
   * @async
   * @function assignLicense
   * @param {string} companyId - The ID of the company to which the license will be assigned.
   * @param {string} licenseId - The ID of the license to be assigned to the company.
   * @param {User} userRequest - The user object of the requester, used for logging who initiated the license assignment.
   * @param {string} clientIp - The IP address from which the license assignment request originated, used for logging purposes.
   * @returns {Promise<void>} A promise that resolves when the license assignment process is complete.
   * @throws {NotFoundException} Throws this exception if the company or license is not found.
   * @throws {Exception} Throws an exception if an error occurs during the license assignment process.
   */
  public assignLicense = async (assignLicenseDto: AssignLicenseDto, userRequest: User, clientIp: string) => {
    try {

      const { companyId, licenseId, paymentId } = assignLicenseDto

      const [ 
        companyResponse,
        licenseResponse,
      ] = await Promise.all([ 
          this.companyModel.findOne({
            _id: companyId,
            representative: userRequest.id,
          }).populate({
            path: 'licenses',
            match: {
              isActive: true,
              isOutdated: false,
              licenseName: { $ne: 'Free' }
            }
          }),
          this.licenseModel.findById(licenseId),
        ])

      if(!companyResponse) {
        throw new NotFoundException(error.USER_DOESNT_HAVE_PERMISSIONS)
      }

      if(!licenseResponse) {
        throw new NotFoundException(error.LICENSE_NOT_FOUND)
      }

      const { licenses } = companyResponse
      
      if(licenses.length) {
        throw new NotAcceptableException(`Ya posees una licencia activa. Por favor verifica.`)
      }

      const startDate = this.dayjsAdapter.getCurrentDate()

      const createdCompanyLicense = await this.companyLicenseModel.create({
        company: companyResponse.id,
        license: licenseResponse.id,
        licenseName: licenseResponse.name,
        payment: paymentId,
        startDate,
        endDate: this.dayjsAdapter.sumDaysToDate(startDate, licenseResponse.days),
        createdBy: userRequest.id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      companyResponse.licenses.push(createdCompanyLicense.id)
      companyResponse.updatedAt = this.dayjsAdapter.getCurrentDateTime()

      await Promise.all([
        companyResponse.save(),
        this.companyLicenseModel.updateMany(
          {
            company: companyResponse.id,
            _id: { $ne: createdCompanyLicense.id },
          },
          {
            $set: {
              isActive: false,
              isOutdated: true,
            },
          }
        ),
        this.trackModel.create({
          ip: clientIp,
          description: `Company ${ companyResponse.id } has a new license ${ licenseResponse.name }.`,
          module: 'Companies',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        }),
      ])
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
