import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() payload: RegisterUserDto): Promise<UserResponseDto> {
    return this.users.register(payload);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(): void {}

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): void {}
}
