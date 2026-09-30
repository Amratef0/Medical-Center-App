import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

/** Parses JWT when present; does not require authentication. */
@Injectable()
export class OptionalJwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return true;
    }
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
