import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column({ name: 'login', type: 'varchar', length: 64 })
  login: string;

  @Column({ name: 'password', type: 'varchar', length: 128 })
  password: string;
}
