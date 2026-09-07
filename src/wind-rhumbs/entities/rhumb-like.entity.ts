import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { WindRhumb } from './wind-rhumb.entity';

@Entity('rhumb_likes')
@Unique('uq_rhumb_likes_user_rhumb', ['userId', 'rhumbId'])
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

  @ManyToOne(() => WindRhumb, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rhumb_id' })
  rhumb: WindRhumb;
}
