import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const request = ctx.switchToHttp().getRequest();
    const payload = request.user;

    if (!payload) {
      return null;
    }

    return {
      userId: String(payload.sub),
      sessionId: payload.sid,
    };
  },
);
