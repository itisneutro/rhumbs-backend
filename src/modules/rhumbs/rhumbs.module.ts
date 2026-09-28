import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RhumbLike } from '../../entities/rhumb-like.entity';
import { Rhumb } from '../../entities/rhumb.entity';
import { User } from '../../entities/user.entity';
import { RhumbsController } from './controllers/rhumbs.controller';
import { TypeORMRhumbsRepository } from './repositories/typeorm-rhumbs.repository';
import { MinioService } from './services/minio.service';
import { RhumbsService } from './services/rhumbs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rhumb, User, RhumbLike])],
  controllers: [RhumbsController],
  providers: [RhumbsService, TypeORMRhumbsRepository, MinioService],
})
export class RhumbsModule {}
