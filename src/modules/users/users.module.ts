import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../entities/users.entity';
import { UsersController } from './controllers/users.controller';
import { TypeORMUsersRepository } from './repositories/typeorm-users.repository';
import { UsersService } from './services/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  controllers: [UsersController],
  providers: [UsersService, TypeORMUsersRepository],
})
export class UsersModule {}
