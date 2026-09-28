import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from './../src/common/http-exception.filter';
import { AppModule } from './../src/app.module';

describe('RhumbsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it('/api/rhumbs (GET)', () => {
    return request(app.getHttpServer() as App)
      .get('/api/rhumbs')
      .expect(200);
  });

  it('/api/rhumbs/feed (GET): один метод на оба адреса', async () => {
    const start = await request(app.getHttpServer() as App)
      .get('/api/rhumbs/feed')
      .expect(200);

    const byId = await request(app.getHttpServer() as App)
      .get('/api/rhumbs/feed/2')
      .expect(200);

    const next = await request(app.getHttpServer() as App)
      .get('/api/rhumbs/feed/2?next=true')
      .expect(200);

    expect((start.body as { id: number }).id).toBe(1);
    expect((byId.body as { id: number }).id).toBe(2);
    expect((next.body as { id: number }).id).toBe(3);

    await request(app.getHttpServer() as App)
      .get('/api/rhumbs/feed/999')
      .expect(404, '');

    await request(app.getHttpServer() as App)
      .get('/api/rhumbs/feed/abc')
      .expect(400, '');
  });

  it('/api/rhumbs (GET): признак создателя 0 или 1', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/rhumbs')
      .expect(200);

    const rhumbs = response.body as { id: number; isCreator: number }[];

    expect(rhumbs.length).toBeGreaterThan(0);

    for (const rhumb of rhumbs) {
      expect([0, 1]).toContain(rhumb.isCreator);
    }

    const own = rhumbs.find((rhumb) => rhumb.id === 1);

    expect(own?.isCreator).toBe(1);
  });

  it('/api/users (POST): регистрация и занятый логин', async () => {
    const login = `e2e.petrov.${process.pid}`;

    const created = await request(app.getHttpServer() as App)
      .post('/api/users')
      .send({ login, password: 'rhumbs2026' })
      .expect(201);

    expect(created.body).toEqual({
      id: expect.any(Number) as number,
      login,
    });

    await request(app.getHttpServer() as App)
      .post('/api/users')
      .send({ login, password: 'rhumbs2026' })
      .expect(400, '');
  });

  afterEach(async () => {
    await app.close();
  });
});
