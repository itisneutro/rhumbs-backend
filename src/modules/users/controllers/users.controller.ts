import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SessionGuard } from '../../../common/session.guard';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  SessionsService,
} from '../services/sessions.service';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiResponse({ status: 201, description: 'Пользователь создан', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Логин занят или данные неверны' })
  async register(@Body() payload: RegisterUserDto): Promise<UserResponseDto> {
    return this.users.register(payload);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход: проверка пароля и выдача куки сессии' })
  @ApiResponse({ status: 200, description: 'Вход выполнен, кука sessionId выдана', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Данные неверны' })
  @ApiResponse({ status: 403, description: 'Неверный логин или пароль' })
  async login(
    @Body() payload: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserResponseDto> {
    const user = await this.users.authenticate(payload);

    if (!user) {
      throw new ForbiddenException();
    }

    const sessionId = await this.sessions.create(user.id, user.login);

    response.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS * 1000,
    });

    return this.users.toResponse(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Выход: сессия удаляется, кука очищается' })
  @ApiResponse({ status: 200, description: 'Выход выполнен' })
  @ApiResponse({ status: 403, description: 'Вход не выполнен' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionId = request.cookies?.[SESSION_COOKIE] as string | undefined;

    if (sessionId) {
      await this.sessions.destroy(sessionId);
    }

    response.clearCookie(SESSION_COOKIE);
  }
}
