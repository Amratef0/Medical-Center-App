import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../../modules/permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionKey = this.reflector.getAllAndOverride<string | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    // This guard is also registered globally, so it runs before JwtAccessGuard
    // and request.user is still empty. Denying here turns every protected
    // action into "Forbidden resource". The controller guard runs again after
    // JWT and performs the real check.
    if (!user?.id) {
      return true;
    }

    const allowed = await this.permissionsService.hasPermission(
      user.id,
      permissionKey,
      request,
    );
    if (!allowed) {
      throw new ForbiddenException({
        ar: 'ليس لديك الصلاحية المطلوبة لتنفيذ هذا الإجراء.',
        en: 'You do not have the required permission for this action.',
      });
    }

    return true;
  }
}
