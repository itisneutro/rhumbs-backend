# Румбы ветра — JSON API (ЛР-3)

Время полёта Boeing-737 NG Лондон–Париж в зависимости от направления ветра.
Услуги — 8 румбов ветра. Приложение на NestJS отдаёт только JSON, шаблонов нет.

## Запуск

```bash
docker compose up -d      # PostgreSQL, Minio, Adminer
npm install
npm run migrate           # применить миграции TypeORM
npm run seed              # демонстрационные данные (на пустую базу)
npm run reset             # вернуть базу к состоянию сида перед показом
npm run start:dev         # http://localhost:3000/api
```

Adminer — http://localhost:8081, консоль Minio — http://localhost:9001.
Параметры базы и Minio берутся из `.env`.

### Postman

Импортировать `postman/rhumbs.postman_collection.json` (Collection v2.1).
В настройках Postman указать **Working directory** — корень репозитория, иначе
запрос с файлами не найдёт `postman/files/rhumbs-demo.jpg` и `.mp4`.
Коллекция из 10 запросов выполняется по порядку: второй запрос сохраняет id
созданного румба в переменную `rhumbsId`, её используют запросы 6, 7 и 8.

Прогон из командной строки:

```bash
npm run reset
npx newman run postman/rhumbs.postman_collection.json --working-dir .
```

## Методы

Базовый адрес — `http://localhost:3000/api`.

| Метод | Адрес | Тело запроса | Тело ответа | Коды |
|---|---|---|---|---|
| GET | `/rhumbs?minAzimuth=` | — | массив румбов | 200, 400 |
| GET | `/rhumbs/feed[/:id]?next=true` | — | румб | 200, 400, 404 |
| GET | `/rhumbs/draft` | — | румб | 200, 404 |
| POST | `/rhumbs` | `multipart/form-data`: `name`, `image`, `video` | румб | 201, 400 |
| PUT | `/rhumbs/draft/publish` | JSON: `name`, `description`, `geographicAzimuthDeg`, `magneticAzimuthDeg` | румб | 200, 404 |
| DELETE | `/rhumbs/:id` | — | пусто | 200, 400, 404 |
| POST | `/rhumbs/:id/like` | JSON: `value` (0 или 1) | румб | 200, 400, 404 |
| POST | `/users` | JSON: `login`, `password` | `{ id, login }` | 201, 400 |
| POST | `/users/login` | — | пусто | 200 |
| POST | `/users/logout` | — | пусто | 200 |

`/users/login` и `/users/logout` — заглушки под ЛР-4: логики в них нет.

Ограничения: `name` — до 64 символов, `description` — до 512 и при публикации
обязательно, `geographicAzimuthDeg` — целое 0–359, `magneticAzimuthDeg` —
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
| `geographicAzimuthDeg` | number \| null | географический азимут, градусы |
| `magneticAzimuthDeg` | number \| null | магнитный азимут, градусы с десятой долей |
| `likesCount` | number | число лайков из `rhumbs_likes` |
| `isCreator` | number | 1, если создатель румба — текущий пользователь, иначе 0 |

`isCreator` — признак 0/1, а не булево значение. Считается при сборке ответа
сравнением `creator_id` уже загруженной строки с текущим пользователем, самого
`creatorId` в ответе нет. Текущий пользователь задан константой в
`src/common/current-user.ts` (id 4), авторизация появится в ЛР-4.

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
| `status` | rhumbs_status | NOT NULL | перечисление `draft` / `published` / `deleted` |
| `geographic_azimuth_deg` | smallint | NULL | |
| `magnetic_azimuth_deg` | numeric(4,1) | NULL | |
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
