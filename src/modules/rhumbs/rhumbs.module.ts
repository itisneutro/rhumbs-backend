import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RhumbsLikes } from '../../entities/rhumbs-likes.entity';
import { Rhumbs } from '../../entities/rhumbs.entity';
import { Users } from '../../entities/users.entity';
import { RhumbsController } from './controllers/rhumbs.controller';
import { TypeORMRhumbsRepository } from './repositories/typeorm-rhumbs.repository';
import { MinioService } from './services/minio.service';
import { RhumbsService } from './services/rhumbs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rhumbs, Users, RhumbsLikes])],
  controllers: [RhumbsController],
  providers: [RhumbsService, TypeORMRhumbsRepository, MinioService],
})
export class RhumbsModule {}
