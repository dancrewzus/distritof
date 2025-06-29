export interface Company {
  id: any;
  isActive: boolean;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: {
    permission: string;
    id: any;
    email: string;
    identifier: string;
    fullname: string;
    firstName: string;
    paternalSurname: string;
    profilePicture: string;
    isLogged: boolean;
    gender: string;
    phoneNumber: string;
    role: string;
    country?: any;
  };
  companies: Company[] | any[];
}

export interface NotLoggedUserResponse {
  user: {
    id: any;
    firstName: string;
    paternalSurname: string;
    email: string;
    isLogged: boolean;
  }
}