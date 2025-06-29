import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  NotAcceptableException,
  Injectable,
  ServiceUnavailableException,
  InternalServerErrorException
} from '@nestjs/common';
import { Observable } from 'rxjs';

import { error } from 'src/common/constants/error-messages';

@Injectable()
export class SystemActivityValidationGuard implements CanActivate {

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

    if (req.method === "GET") {
      return true
    }

    // Si la empresa es creada por primera vez, no se valida el companyId
    if (companyId === "none" && req.method === 'POST' && req.route.path.includes('companies')) {
      return true;
    }

    if(!companyId || companyId === "none" || companyId.length < 23) {
      throw new NotAcceptableException(error.COMPANY_ID_NOT_FOUND);
    }

    const company = user.companies.find((item) => item.company._id.toString() === companyId)?.company;
    if (!company) {
      throw new InternalServerErrorException(error.COMPANY_NOT_FOUND);
    }

    if (!company?.parameter[0]?.journalStart || !company?.parameter[0]?.journalEnd) {
      throw new InternalServerErrorException(error.SYSTEM_ACTIVITY_NOT_FOUND);
    }

    const { journalStart, journalEnd } = company.parameter[0];
    const currentTime = new Date();
    const [startHour, startMinute] = journalStart.split(':').map(Number);
    const [endHour, endMinute] = journalEnd.split(':').map(Number);

    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);

    if (currentTime < startTime || currentTime > endTime) {
      // throw new ServiceUnavailableException(error.SYSTEM_ACTIVITY_EXPIRED);
    }

    return true;
  }
}
