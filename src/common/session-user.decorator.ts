import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { GUEST_USER_ID } from './session.middleware';

export const SessionUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<Request>();

    return request.userId ?? GUEST_USER_ID;
  },
);
