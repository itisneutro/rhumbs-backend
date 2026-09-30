import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from '../dto/login-user.dto';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { Users } from '../../../entities/users.entity';
import { TypeORMUsersRepository } from '../repositories/typeorm-users.repository';

const HASH_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly users: TypeORMUsersRepository) {}

  async authenticate(payload: LoginUserDto): Promise<Users | null> {
    const user = await this.users.findByLogin(payload.login);

    if (!user) {
      return null;
    }

    const matches = await bcrypt.compare(payload.password, user.password);

    return matches ? user : null;
  }

  toResponse(user: Users): UserResponseDto {
    return plainToInstance(
      UserResponseDto,
      { id: user.id, login: user.login },
      { excludeExtraneousValues: true },
    );
  }

  async register(payload: RegisterUserDto): Promise<UserResponseDto> {
    const taken = await this.users.existsByLogin(payload.login);

    if (taken) {
      throw new BadRequestException();
    }

    const password = await bcrypt.hash(payload.password, HASH_ROUNDS);
    const user = await this.users.create(payload.login, password);

    return this.toResponse(user);
  }
}
