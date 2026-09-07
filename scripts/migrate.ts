import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { RhumbLike } from '../src/wind-rhumbs/entities/rhumb-like.entity';
import { User } from '../src/wind-rhumbs/entities/user.entity';
import { WindRhumb } from '../src/wind-rhumbs/entities/wind-rhumb.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [WindRhumb, User, RhumbLike],
  synchronize: false,
});

async function migrate(): Promise<void> {
  await dataSource.initialize();
  await dataSource.synchronize();
  await dataSource.destroy();

  console.log('Таблицы wind_rhumbs, users, rhumb_likes созданы');
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
