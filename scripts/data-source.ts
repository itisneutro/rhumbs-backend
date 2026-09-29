import 'reflect-metadata';
import { join } from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { RhumbsLikes } from '../src/entities/rhumbs-likes.entity';
import { Rhumbs } from '../src/entities/rhumbs.entity';
import { Users } from '../src/entities/users.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Rhumbs, Users, RhumbsLikes],
  migrations: [join(__dirname, '..', 'src', 'migrations', '*.ts')],
  migrationsTableName: 'rhumbs_migrations',
  synchronize: false,
});

export default dataSource;
