import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import {
  SESSION_COOKIE,
  SessionsService,
} from '../modules/users/services/sessions.service';

export const GUEST_USER_ID = 0;

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly sessions: SessionsService) {}

  async use(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): Promise<void> {
    const sessionId = request.cookies?.[SESSION_COOKIE] as string | undefined;

    request.userId = sessionId
      ? ((await this.sessions.getUserId(sessionId)) ?? GUEST_USER_ID)
      : GUEST_USER_ID;

    next();
  }
}
