import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  NotAcceptableException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { error } from 'src/common/constants/error-messages';

@Injectable()
export class LicenseValidationGuard implements CanActivate {

  constructor(
  ) {}

  canActivate(
    ctx: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const req = ctx.switchToHttp().getRequest();
    const companyId = req.headers["x-company-id"];
    const user = req.user;

    if(!user) {
      throw new InternalServerErrorException(error.USER_NOT_FOUND);
    }

    // Si la empresa es creada por primera vez, no se valida el companyId
    if (companyId === "none" && req.method === 'POST' && req.route.path.includes('companies')) {
      return true;
    }

    if(!['root', 'admin'].includes(user?.role?.name) && (companyId === "none" || companyId.length < 23)) {
      throw new NotAcceptableException(error.COMPANY_ID_NOT_FOUND);
    }

    if (req.method === "GET") {
      return true
    }

    const company = user.companies.find((item) => item.company._id.toString() === companyId)?.company;
    if (!company) {
      throw new InternalServerErrorException(error.COMPANY_NOT_FOUND);
    }

    const currentLicense = company.licenses.find((item) => item.isActive);
    if (!currentLicense) {
      throw new InternalServerErrorException(error.LICENSE_NOT_FOUND);
    }

    return currentLicense?.isOutdated;
  }
}
