import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Rhumbs } from './rhumbs.entity';
import { Users } from './users.entity';

@Entity('rhumbs_likes')
@Unique('uq_rhumbs_likes', ['userId', 'rhumbsId'])
export class RhumbsLikes {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'rhumbs_id', type: 'integer' })
  rhumbsId: number;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Rhumbs, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rhumbs_id' })
  rhumbs: Rhumbs;
}
