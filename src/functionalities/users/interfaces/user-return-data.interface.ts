import { City } from "src/functionalities/cities/entities/city.entity";
import { Route } from "src/functionalities/routes/entities/route.entity";
import { RouteUser } from "src/functionalities/routes/entities/routeUser.entity";

export interface Company {
  id: any;
  isActive: boolean;
  name: string;
}

export interface UserReturnData {
  user?: {
    permission: string;
    id: any;
    email: string;
    identifier: string;
    identifierType: string;	
    country: string;
    fullname: string;
    firstName: string;
    paternalSurname: string;
    profilePicture: string;
    addressPicture: string;
    securityQuestion: string;
    isLogged: boolean;
    gender: string;
    phoneNumber: string;
    points?: number;
    geolocation?: any;
    role: string;
    residenceAddress: string;
    billingAddress: string;
    entryDate?: string;
    route?: Route;
    routes?: number;
    supervisorRoutes?: RouteUser[];
    createdAt: string;
    city?: City;
  };
  companies?: Company[];
}