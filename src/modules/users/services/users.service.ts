import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { TypeORMUsersRepository } from '../repositories/typeorm-users.repository';

const HASH_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly users: TypeORMUsersRepository) {}

  async register(payload: RegisterUserDto): Promise<UserResponseDto> {
    const taken = await this.users.existsByLogin(payload.login);

    if (taken) {
      throw new BadRequestException();
    }

    const password = await bcrypt.hash(payload.password, HASH_ROUNDS);
    const user = await this.users.create(payload.login, password);

    return plainToInstance(
      UserResponseDto,
      { id: user.id, login: user.login },
      { excludeExtraneousValues: true },
    );
  }
}
