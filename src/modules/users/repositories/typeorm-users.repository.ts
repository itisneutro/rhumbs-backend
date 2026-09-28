import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

@Injectable()
export class TypeORMUsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async existsByLogin(login: string): Promise<boolean> {
    return this.users.exists({ where: { login } });
  }

  async create(login: string, password: string): Promise<User> {
    return this.users.save(this.users.create({ login, password }));
  }
}
