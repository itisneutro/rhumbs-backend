import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Rhumb } from './rhumb.entity';
import { User } from './user.entity';

@Entity('rhumbs_likes')
@Unique('uq_rhumbs_likes_user_rhumb', ['userId', 'rhumbId'])
export class RhumbLike {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ name: 'user_id', type: 'integer' })
  userId: number;

  @Column({ name: 'rhumb_id', type: 'integer' })
  rhumbId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Rhumb, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rhumb_id' })
  rhumb: Rhumb;
}
