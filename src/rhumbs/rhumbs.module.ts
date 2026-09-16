import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RhumbLike } from './entities/rhumb-like.entity';
import { Rhumb } from './entities/rhumb.entity';
import { User } from './entities/user.entity';
import { RhumbsController } from './rhumbs.controller';
import { RhumbsService } from './rhumbs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rhumb, User, RhumbLike])],
  controllers: [RhumbsController],
  providers: [RhumbsService],
})
export class RhumbsModule {}
