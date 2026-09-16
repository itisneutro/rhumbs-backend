import 'reflect-metadata';
import { join } from 'node:path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { RhumbLike } from '../src/rhumbs/entities/rhumb-like.entity';
import { Rhumb } from '../src/rhumbs/entities/rhumb.entity';
import { User } from '../src/rhumbs/entities/user.entity';

config();

// Один источник данных для команды миграции и для генератора TypeORM.
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Rhumb, User, RhumbLike],
  migrations: [join(__dirname, '..', 'src', 'migrations', '*.ts')],
  migrationsTableName: 'rhumbs_migrations',
  synchronize: false,
});

export default dataSource;
