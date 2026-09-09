import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export type WindRhumbStatus = 'draft' | 'published' | 'deleted';

@Entity('wind_rhumbs')
export class WindRhumb {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name: string;

  @Column({ name: 'description', type: 'varchar', length: 512, nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 256, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'video_url', type: 'varchar', length: 256, nullable: true })
  videoUrl: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['draft', 'published', 'deleted'],
    enumName: 'wind_rhumb_status',
  })
  status: WindRhumbStatus;

  // географический азимут — целые градусы 0..315
  @Column({ name: 'rhumb_geographic_azimuth_deg', type: 'smallint', nullable: true })
  rhumbGeographicAzimuthDeg: number | null;

  // магнитный азимут — градусы с десятой долей, склонение Москвы 11.5°
  @Column({
    name: 'rhumb_magnetic_azimuth_deg',
    type: 'numeric',
    precision: 4,
    scale: 1,
    nullable: true,
  })
  rhumbMagneticAzimuthDeg: string | null;

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
