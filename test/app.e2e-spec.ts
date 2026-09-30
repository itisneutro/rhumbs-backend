import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { HttpExceptionFilter } from './../src/common/http-exception.filter';
import { AppModule } from './../src/app.module';

const PUBLISH_BODY = {
  name: 'Тестовый румб',
  description: 'Краткое описание',
  geoAzimuth: 45,
  magAzimuth: 33.5,
};

describe('RhumbsController (e2e)', () => {
  let app: INestApplication;

  const login = async (
    password = 'rhumbs2026',
  ): Promise<{ status: number; cookie: string }> => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/users/login')
      .send({ login: 'n.vasilev', password });

    const header = response.headers['set-cookie'] as unknown as
      | string[]
      | undefined;

    return { status: response.status, cookie: header?.[0] ?? '' };
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
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

  it('/api/rhumbs (GET): гость получает нули в признаках', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/rhumbs')
      .expect(200);

    const rhumbs = response.body as { isCreator: number; isLiked: number }[];

    expect(rhumbs.length).toBeGreaterThan(0);

    for (const item of rhumbs) {
      expect(item.isCreator).toBe(0);
      expect(item.isLiked).toBe(0);
    }
  });

  it('/api/rhumbs (GET): после входа признаки считаются по сессии', async () => {
    const { cookie } = await login();

    const response = await request(app.getHttpServer() as App)
      .get('/api/rhumbs')
      .set('Cookie', cookie)
      .expect(200);

    const rhumbs = response.body as {
      id: number;
      isCreator: number;
      isLiked: number;
    }[];

    for (const item of rhumbs) {
      expect([0, 1]).toContain(item.isCreator);
      expect([0, 1]).toContain(item.isLiked);
    }

    const own = rhumbs.find((one) => one.id === 1);

    expect(own?.isCreator).toBe(1);
    expect(own?.isLiked).toBe(1);

    const foreign = rhumbs.find((one) => one.id === 3);

    expect(foreign?.isLiked).toBe(0);
  });

  it('/api/rhumbs/:id/like (POST): isLiked отражает новое состояние', async () => {
    const { cookie } = await login();

    const liked = await request(app.getHttpServer() as App)
      .post('/api/rhumbs/2/like')
      .set('Cookie', cookie)
      .send({ value: 1 })
      .expect(200);

    expect((liked.body as { isLiked: number }).isLiked).toBe(1);

    const unliked = await request(app.getHttpServer() as App)
      .post('/api/rhumbs/2/like')
      .set('Cookie', cookie)
      .send({ value: 0 })
      .expect(200);

    expect((unliked.body as { isLiked: number }).isLiked).toBe(0);
  });

  it('/api/rhumbs/draft/publish (PUT): гостю 403 с пустым телом', () => {
    return request(app.getHttpServer() as App)
      .put('/api/rhumbs/draft/publish')
      .send(PUBLISH_BODY)
      .expect(403, '');
  });

  it('/api/users/login (POST): неверный пароль — 403 с пустым телом', async () => {
    const { status, cookie } = await login('неверный');

    expect(status).toBe(403);
    expect(cookie).toBe('');
  });

  it('/api/users/logout (POST): после выхода защищённый метод даёт 403', async () => {
    const { cookie } = await login();

    await request(app.getHttpServer() as App)
      .get('/api/rhumbs/draft')
      .set('Cookie', cookie)
      .expect(404, '');

    await request(app.getHttpServer() as App)
      .post('/api/users/logout')
      .set('Cookie', cookie)
      .expect(200, '');

    await request(app.getHttpServer() as App)
      .put('/api/rhumbs/draft/publish')
      .set('Cookie', cookie)
      .send(PUBLISH_BODY)
      .expect(403, '');
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
