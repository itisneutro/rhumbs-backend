import { join } from 'node:path';
import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('RhumbsController (e2e)', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    app.setViewEngine('hbs');
    hbs.registerPartials(join(__dirname, '..', 'views', 'partials'));
    await app.init();
  });

  it('/rhumbs (GET)', () => {
    return request(app.getHttpServer() as App)
      .get('/rhumbs')
      .expect(200);
  });

  it('/rhumbs/draft (GET)', () => {
    return request(app.getHttpServer() as App)
      .get('/rhumbs/draft')
      .expect(200);
  });

  it('/rhumbs/feed/1 (GET)', () => {
    return request(app.getHttpServer() as App)
      .get('/rhumbs/feed/1')
      .expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
