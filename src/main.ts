import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { SESSION_COOKIE } from './modules/users/services/sessions.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const config = new DocumentBuilder()
    .setTitle('Румбы — API')
    .setDescription(
      'Время полёта Boeing-737 NG Лондон–Париж в зависимости от направления ветра',
    )
    .setVersion('4.0')
    .addCookieAuth(
      SESSION_COOKIE,
      { type: 'apiKey', in: 'cookie', name: SESSION_COOKIE },
      SESSION_COOKIE,
    )
    .addTag('rhumbs', 'Румбы: список, лента, черновик, публикация, лайк')
    .addTag('users', 'Пользователи: регистрация, вход, выход')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  await app.init();

  app.use((_request: Request, response: Response) => {
    response.status(HttpStatus.NOT_FOUND).end();
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
