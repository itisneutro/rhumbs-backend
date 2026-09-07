import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RhumbLike } from './entities/rhumb-like.entity';
import { User } from './entities/user.entity';
import { WindRhumb } from './entities/wind-rhumb.entity';
import { WindRhumbsController } from './wind-rhumbs.controller';
import { WindRhumbsService } from './wind-rhumbs.service';

@Module({
  imports: [TypeOrmModule.forFeature([WindRhumb, User, RhumbLike])],
  controllers: [WindRhumbsController],
  providers: [WindRhumbsService],
})
export class WindRhumbsModule {}
