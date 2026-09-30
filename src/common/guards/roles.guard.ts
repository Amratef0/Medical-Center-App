import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/user.entity';

export const ROLES_KEY = 'roles';
export const ALLOW_ANY_STAFF_KEY = 'allow_any_staff';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Any authenticated staff user may access (JwtAccessGuard must run first). */
export const AllowAnyStaff = () => SetMetadata(ALLOW_ANY_STAFF_KEY, true);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const allowAnyStaff = this.reflector.getAllAndOverride<boolean>(ALLOW_ANY_STAFF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !allowAnyStaff) {
      return false;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    if (allowAnyStaff) {
      return true;
    }

    return requiredRoles.includes(user.role);
  }
}
