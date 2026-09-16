import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export type RhumbStatus = 'draft' | 'published' | 'deleted';

@Entity('rhumbs')
export class Rhumb {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 512, nullable: true })
  description: string | null;

  // адреса обязательны: пустая строка означает «показать заглушку с SSR-сервера»
  @Column({
    name: 'image_url',
    type: 'varchar',
    length: 256,
    nullable: false,
    default: '',
  })
  imageUrl: string;

  @Column({
    name: 'video_url',
    type: 'varchar',
    length: 256,
    nullable: false,
    default: '',
  })
  videoUrl: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['draft', 'published', 'deleted'],
    enumName: 'rhumb_status',
  })
  status: RhumbStatus;

  // географический азимут — целые градусы 0..315
  @Column({ name: 'geographic_azimuth_deg', type: 'smallint', nullable: true })
  geographicAzimuthDeg: number | null;

  // магнитный азимут — градусы с десятой долей, склонение Москвы 11.5°
  @Column({
    name: 'magnetic_azimuth_deg',
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  magneticAzimuthDeg: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'creator_id', type: 'integer' })
  creatorId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  // дата формирования — проставляется при публикации, у черновика пуста
  @Column({ name: 'formed_at', type: 'timestamptz', nullable: true })
  formedAt: Date | null;
}
