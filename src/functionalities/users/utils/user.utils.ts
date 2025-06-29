import { Injectable } from "@nestjs/common";

import { ContractNote } from 'src/functionalities/contract-notes/entities/note.entity'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Utils } from 'src/common/utils/utils'
import { User } from "../entities/user.entity";
import { Company } from "src/functionalities/companies/entities/company.entity";
import { UserReturnData } from "../interfaces/user-return-data.interface";
import { Role } from "src/functionalities/roles/entities/role.entity";

@Injectable()
export class UserUtils {

  constructor(
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) { }

  /**
     * Formats the return data for a user and their associated companies. This includes structuring user data and
     * compiling a list of associated companies.
     *
     * @public
     * @function formatReturnData
     * @param {User} user - The user object containing user details.
     * @param {Company[]} [companies=[]] - An array of company objects associated with the user.
     * @returns {UserReturnData} An object containing the formatted user and company data.
     */
    public formatReturnData = (user: User, companies: Company[] = [], littleData: boolean = false, attrs: string[] = []): UserReturnData => {
      const permission: string = user.role 
        ? this.utils.getUserPermissions(user.role.name) 
        : ''
      
      const { userData, routes, role } = user
      const supervisorRoutes = []
      const clientRoutes = []
      let route = null

      if(role.name !== 'companySupervisor' && role.name !== 'companyClient') {
        const routeClient = routes?.find((userRoute) => userRoute.role === role.name)
        route = routeClient ? routeClient.route : null
      } else {
        if(role.name === 'companySupervisor') {
          routes.forEach((routeUser) => {
            const { route } = routeUser
            const newRoute = {
              id: route._id,
              isActive: route.isActive,
              name: route.name,
              description: route.description,
              direction: route.direction,
              phoneNumber: route.phoneNumber,
              company: route.company,
              city: route.city,
              deletedAt: route.deletedAt,
              createdAt: route.createdAt,
              updatedAt: route.updatedAt,
              deleted: route.deleted,
            }
            const newRouteUser = {
              id: routeUser._id,
              isActive: routeUser.isActive,
              route: newRoute,
              user: routeUser.user,
              role: routeUser.role,
              deletedAt: routeUser.deletedAt,
              createdAt: routeUser.createdAt,
              updatedAt: routeUser.updatedAt,
              deleted: routeUser.deleted,
            }
            supervisorRoutes.push(newRouteUser)
          });
        }
        if(role.name === 'companyClient') {
          routes.forEach((routeUser) => {
            const { route } = routeUser
            const newRoute = {
              id: route._id,
              isActive: route.isActive,
              name: route.name,
              description: route.description,
              direction: route.direction,
              phoneNumber: route.phoneNumber,
              company: route.company,
              city: route.city,
              deletedAt: route.deletedAt,
              createdAt: route.createdAt,
              updatedAt: route.updatedAt,
              deleted: route.deleted,
            }
            const newRouteUser = {
              id: routeUser._id,
              isActive: routeUser.isActive,
              route: newRoute,
              user: routeUser.user,
              role: routeUser.role,
              deletedAt: routeUser.deletedAt,
              createdAt: routeUser.createdAt,
              updatedAt: routeUser.updatedAt,
              deleted: routeUser.deleted,
            }
            clientRoutes.push(newRouteUser)
          });
        }
      }

      const mappedUser = {
        permission,
        id: user.id,
        email: user.email,
        identifier: user.identifier,
        identifierType: user.identifierType.name,
        country: user.country?.id,
        isLogged: user.isLogged || false,
        fullname: `${ this.utils.capitalizeFirstLetter(user.firstName).trim() } ${ this.utils.capitalizeFirstLetter(user.paternalSurname).trim() }` || '',
        firstName: this.utils.capitalizeFirstLetter(user.firstName).trim() || '',
        paternalSurname: this.utils.capitalizeFirstLetter(user.paternalSurname).trim() || '',
        profilePicture: userData?.profilePicture?.imageUrl || '',
        addressPicture: userData?.addressPicture?.imageUrl || '',
        securityQuestion: userData?.securityQuestion || '',
        phoneNumber: userData?.phoneNumber || '',
        points: userData?.points || 0,
        geolocation: userData?.geolocation || {},
        role: role?.name || '',
        gender: userData?.gender || '',
        residenceAddress: userData?.residenceAddress || '',
        billingAddress: userData?.billingAddress || '',
        entryDate: userData?.entryDate || '',
        city: userData?.cities?.length ? userData?.cities[0] : null,
        createdAt: user.createdAt,
        createdBy: user.createdBy ? `${ this.utils.capitalizeFirstLetter(user.createdBy.firstName).trim() } ${ this.utils.capitalizeFirstLetter(user.createdBy.paternalSurname).trim() }` : '',
        supervisorRoutes,
        clientRoutes,
        route,
      }

      if(user.role.name !== 'companySupervisor') delete mappedUser.supervisorRoutes
      if(user.role.name !== 'companyClient') delete mappedUser.clientRoutes

      if(littleData) {
        delete mappedUser.isLogged
        delete mappedUser.firstName
        delete mappedUser.paternalSurname
        delete mappedUser.profilePicture
        delete mappedUser.addressPicture
        delete mappedUser.securityQuestion
        delete mappedUser.points
        delete mappedUser.geolocation
        delete mappedUser.role
        delete mappedUser.gender
        delete mappedUser.residenceAddress
        delete mappedUser.billingAddress
        delete mappedUser.entryDate
        delete mappedUser.city
        delete mappedUser.createdAt
        delete mappedUser.createdBy
        delete mappedUser.supervisorRoutes
        delete mappedUser.route
      }

      return {
        user: mappedUser,
        companies: companies.map((company) => {
          return {
            id: company.id,
            isActive: company.isActive,
            name: company.name,
          };
        }),
      }
    }
}