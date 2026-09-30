import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { GUEST_USER_ID } from './session.middleware';

@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.userId || request.userId === GUEST_USER_ID) {
      throw new ForbiddenException();
    }

    return true;
  }
}
