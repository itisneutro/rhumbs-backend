import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../../../entities/users.entity';

@Injectable()
export class TypeORMUsersRepository {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  async existsByLogin(login: string): Promise<boolean> {
    return this.usersRepository.exists({ where: { login } });
  }

  async create(login: string, password: string): Promise<Users> {
    return this.usersRepository.save(this.usersRepository.create({ login, password }));
  }
}
