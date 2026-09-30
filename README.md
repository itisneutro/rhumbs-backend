# Румбы — JSON API (ЛР-4)

Время полёта Boeing-737 NG Лондон–Париж в зависимости от направления ветра.
Услуги — 8 румбов ветра. Приложение на NestJS отдаёт только JSON, шаблонов нет.

## Запуск

```bash
docker compose up -d      # PostgreSQL 18, Redis 7, Minio, Adminer
npm install
npm run migrate           # применить миграции TypeORM
npm run seed              # демонстрационные данные (на пустую базу)
npm run reset             # вернуть базу к состоянию сида перед показом
npm run start:dev         # http://localhost:3000/api
```

Adminer (`adminer:6.0.1`) — http://localhost:8081, консоль Minio
(`minio/minio:RELEASE.2025-09-07T16-13-09Z`) — http://localhost:9001,
Swagger UI — http://localhost:3000/api/docs (единственная HTML-страница проекта).
Параметры базы, Minio и Redis берутся из `.env` (`REDIS_HOST`, `REDIS_PORT`).

### Postman

Импортировать `postman/rhumbs.postman_collection.json` (Collection v2.1).
В настройках Postman указать **Working directory** — корень репозитория, иначе
запрос с файлами не найдёт `postman/files/rhumbs-demo.jpg` и `.mp4`.
Коллекция из 10 запросов выполняется по порядку: второй запрос сохраняет id
созданного румба в переменную `rhumbsId`, её используют запросы 6, 7 и 8.

Первый запрос коллекции — «0. Вход»: он логинится как `n.vasilev` и кладёт куку
в переменную коллекции `sessionId`, которую защищённые запросы подставляют в
заголовок `Cookie`.

Прогон из командной строки:

```bash
npm run reset
npx newman run postman/rhumbs.postman_collection.json --working-dir .
```

## Показ ЛР-4

1. Открыть Swagger в окне инкогнито: http://localhost:3000/api/docs. Защищённые
   методы без куки отвечают 403 с пустым телом.
2. Выполнить там же `POST /api/users/login` с `n.vasilev` / `rhumbs2026` —
   браузер сохранит куку, и те же методы начнут отвечать 200.
3. Забрать значение куки: DevTools → Application → Cookies →
   http://localhost:3000 → `sessionId`.
4. Импортировать `postman/rhumbs-lab4.postman_collection.json` («Румбы — ЛР-4»),
   вставить значение в переменную коллекции `sessionId` и пройти пять запросов:
   список без куки и с кукой (видно разницу в `isCreator` и `isLiked`),
   публикация гостем — 403, добавление и публикация с кукой — 201 и 200.
   Working directory Postman — корень репозитория, иначе не найдутся файлы.

Сессии в Redis смотреть так:

```bash
docker exec -it rhumbs-redis redis-cli KEYS 'session:*'
docker exec -it rhumbs-redis redis-cli HGETALL session:<sessionId>
```

В хэше лежат `userId` и `login`, у ключа TTL 3600 с; `POST /api/users/logout`
удаляет ключ.

## Методы

Базовый адрес — `http://localhost:3000/api`.

| Метод | Адрес | Тело запроса | Тело ответа | Коды |
|---|---|---|---|---|
| GET | `/rhumbs?minAzimuth=` | — | массив румбов | 200, 400 |
| GET | `/rhumbs/feed[/:id]?next=true` | — | румб | 200, 400, 404 |
| GET | `/rhumbs/draft` | — | румб | 200, 404 |
| POST | `/rhumbs` | `multipart/form-data`: `name`, `image`, `video` | румб | 201, 400 |
| PUT | `/rhumbs/draft/publish` | JSON: `name`, `description`, `geoAzimuth`, `magAzimuth` | румб | 200, 400, 404 |
| DELETE | `/rhumbs/:id` | — | пусто | 200, 400, 404 |
| POST | `/rhumbs/:id/like` | JSON: `value` (0 или 1) | румб | 200, 400, 404 |
| POST | `/users` | JSON: `login`, `password` | `{ id, login }` | 201, 400 |
| POST | `/users/login` | JSON: `login`, `password` | `{ id, login }` | 200, 400, 403 |
| POST | `/users/logout` | — | пусто | 200, 403 |

## Вход и сессии

`POST /users/login` находит пользователя по логину и сверяет пароль через
`bcrypt.compare`. При успехе создаётся сессия: `crypto.randomUUID()` кладётся в
Redis хэшем `session:<sessionId>` с полями `userId` и `login`, время жизни ключа
3600 с. Идентификатор возвращается кукой `sessionId` — `httpOnly`,
`sameSite: lax`, `maxAge` 1 час. Неверный логин или пароль — 403 с пустым телом,
без подсказки, что именно не совпало.

`POST /users/logout` удаляет ключ из Redis и очищает куку, отвечает 200 без тела.

Текущий пользователь берётся только из сессии: middleware читает куку, находит
`userId` в Redis и кладёт его в запрос; без куки или с истёкшей сессией
запрос считается гостевым. Константы пользователя в коде больше нет.

Вход обязателен для шести методов — `GET /rhumbs/draft`, `POST /rhumbs`,
`PUT /rhumbs/draft/publish`, `DELETE /rhumbs/:id`, `POST /rhumbs/:id/like` и
`POST /users/logout`: гостю они отвечают **403 с пустым телом**. Остальные
открыты всем: `GET /rhumbs`, `GET /rhumbs/feed[/:id]`, `POST /users`,
`POST /users/login`. Гость получает те же поля румба, но `isCreator` и `isLiked`
у него всегда 0. Создатель нового черновика проставляется из сессии.

Ограничения: `name` — до 64 символов, `description` — до 512 и при публикации
обязательно, `geoAzimuth` — целое 0–359, `magAzimuth` —
0–359.9 с одним знаком после запятой, `minAzimuth` — целое 0–359,
`image` — изображение до 5 МБ, `video` — mp4 до 50 МБ, `login` — до 64 символов,
`password` — до 72 байт (ограничение bcrypt). Файлы при создании необязательны.
Черновик у пользователя один: повторный `POST /rhumbs` даёт 400, а публикации
id не нужен — черновик ищется по текущему пользователю.

### Румб в ответе

Набор полей одинаков во всех методах домена румбов:

| Поле | Тип | Пояснение |
|---|---|---|
| `id` | number | идентификатор |
| `name` | string | название |
| `description` | string \| null | краткое описание, у черновика `null` |
| `imageUrl` | string \| null | `MINIO_PUBLIC_URL` + ключ, при пустом ключе `null` |
| `videoUrl` | string \| null | то же для видео |
| `geoAzimuth` | number \| null | географический азимут, градусы |
| `magAzimuth` | number \| null | магнитный азимут, градусы с десятой долей |
| `likesCount` | number | число лайков из `rhumbs_likes` |
| `isCreator` | number | 1, если создатель румба — текущий пользователь, иначе 0 |
| `isLiked` | number | 1, если лайк текущего пользователя на этом румбе уже стоит, иначе 0 |

`isCreator` и `isLiked` — признаки 0/1, а не булевы значения. `isCreator`
считается при сборке ответа сравнением `creator_id` уже загруженной строки с
текущим пользователем, самого `creatorId` в ответе нет. `isLiked` нужен ленте,
чтобы нарисовать кнопку лайка в нужном состоянии: в списке он приходит из того
же запроса подзапросом `EXISTS` по `rhumbs_likes`, для одного румба — проверкой
`exists` в репозитории; в ответе на лайк показывает уже новое состояние.
Текущий пользователь определяется сессией (кука `sessionId`), у гостя оба
признака равны 0.

Ответ пользователя — `{ id, login }`, пароль и его хэш не отдаются никогда.

## Таблицы

### rhumbs

| Столбец | Тип | NULL | Ключи |
|---|---|---|---|
| `id` | integer | NOT NULL | PRIMARY KEY, `nextval('rhumbs_id_seq')` |
| `name` | varchar(64) | NOT NULL | |
| `description` | varchar(512) | NULL | |
| `image_key` | varchar(256) | NOT NULL | по умолчанию `''` |
| `video_key` | varchar(256) | NOT NULL | по умолчанию `''` |
| `status` | varchar(16) | NOT NULL | CHECK `chk_rhumbs_status`: `draft` / `published` / `deleted` |
| `geo_azimuth` | smallint | NULL | |
| `mag_azimuth` | numeric(4,1) | NULL | |
| `created_at` | timestamptz | NOT NULL | по умолчанию `now()` |
| `creator_id` | integer | NOT NULL | FOREIGN KEY → `users.id`, ON DELETE RESTRICT |
| `formed_at` | timestamptz | NULL | проставляется при публикации |

В `image_key` и `video_key` лежит только имя объекта в бакете `rhumbs`
(`rhumbs-north.jpg`), адреса в базе не хранятся.

### users

| Столбец | Тип | NULL | Ключи |
|---|---|---|---|
| `id` | integer | NOT NULL | PRIMARY KEY, `nextval('users_id_seq')` |
| `login` | varchar(64) | NOT NULL | |
| `password` | varchar(128) | NOT NULL | bcrypt-хэш, 60 символов |

### rhumbs_likes

| Столбец | Тип | NULL | Ключи |
|---|---|---|---|
| `id` | integer | NOT NULL | PRIMARY KEY, `nextval('rhumbs_likes_id_seq')` |
| `user_id` | integer | NOT NULL | FOREIGN KEY → `users.id`, ON DELETE RESTRICT |
| `rhumbs_id` | integer | NOT NULL | FOREIGN KEY → `rhumbs.id`, ON DELETE RESTRICT |

UNIQUE `uq_rhumbs_likes` на пару (`user_id`, `rhumbs_id`):
один пользователь ставит румбу не больше одного лайка. Каскадного удаления нет.

## Правила ответов

- Результат передаётся кодом HTTP, а не текстом: тела у ошибок нет совсем —
  ни `statusCode`, ни `message`, ни `error`. Глобальный фильтр переводит любое
  исключение в `res.status(код).end()`.
- Коды: 200 — успех, 201 — создание, 400 — неверные данные, 404 — объект не
  найден или недоступен текущему пользователю.
- Набор полей в ответе фиксирован и одинаков для всех румбов; незаполненные
  поля присутствуют со значением `null`, а не пропускаются.
- Лишние поля в теле или строке запроса запрещены: `ValidationPipe` с
  `whitelist` и `forbidNonWhitelisted` отвечает 400.
- Статус румба (`draft` / `published` / `deleted`), создатель и даты в ответе не
  отдаются. Списки и лента показывают только опубликованные румбы.
- 403 — вход не выполнен: тело тоже пустое, как у остальных ошибок.
