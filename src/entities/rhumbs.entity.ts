import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from './users.entity';

export type RhumbsStatus = 'draft' | 'published' | 'deleted';

@Entity('rhumbs')
export class Rhumbs {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 512, nullable: true })
  description: string | null;

  @Column({
    name: 'image_key',
    type: 'varchar',
    length: 256,
    nullable: false,
    default: '',
  })
  imageKey: string;

  @Column({
    name: 'video_key',
    type: 'varchar',
    length: 256,
    nullable: false,
    default: '',
  })
  videoKey: string;

  @Column({ name: 'status', type: 'varchar', length: 16 })
  status: RhumbsStatus;

  @Column({ name: 'geo_azimuth', type: 'smallint', nullable: true })
  geoAzimuth: number | null;

  @Column({
    name: 'mag_azimuth',
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  magAzimuth: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ name: 'creator_id', type: 'integer' })
  creatorId: number;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: Users;

  @Column({ name: 'formed_at', type: 'timestamptz', nullable: true })
  formedAt: Date | null;
}
