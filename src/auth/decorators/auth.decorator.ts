import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RoleProtected } from './role-protected.decorator';
import { UserRoleGuard } from '../guards/user-role.guard';
import { LicenseValidationGuard } from '../guards/license-validation.guard';
import { SystemActivityValidationGuard } from '../guards/system-activity-validation.guard';
import { ValidRoles } from '../interfaces/valid-roles';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards( AuthGuard(), UserRoleGuard ),
    // FIXME: Cuando se loguea por primera vez el front no envía el parametro x-company-id lo que implica que siempre revienten los validadores
    // UseGuards( AuthGuard(), LicenseValidationGuard ),
    // UseGuards( AuthGuard(), SystemActivityValidationGuard ),
  );
}