import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  IS_PUBLIC_KEY,
  OPTIONAL_AUTH_KEY,
} from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );

    if (isPublic) {
      return true;
    }

    const optionalAuth = this.reflector.getAllAndOverride<boolean>(
      OPTIONAL_AUTH_KEY,
      targets,
    );
    const request = context.switchToHttp().getRequest();
    if (optionalAuth && request.headers.authorization === undefined) {
      return true;
    }

    // If the route is not public, proceed with the default JWT authentication
    return super.canActivate(context);
  }
}
