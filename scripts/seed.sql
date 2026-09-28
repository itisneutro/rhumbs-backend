BEGIN;

INSERT INTO users (id, login, password) VALUES (4, 'n.vasilev', '$2b$10$9t./3.aXgm9dpFliELxlq.GuP4FTJ/zaYizl4CgbN6H/Nxnbq4wTm');
INSERT INTO users (id, login, password) VALUES (5, 'a.sokolova', '$2b$10$lXElNIDfMEmfOn0sBMFv6OecSohSVexfRjtGClFdfBbNogyGnRry.');
INSERT INTO users (id, login, password) VALUES (6, 'p.erokhin', '$2b$10$/qmAexUtFRsGAv6D2YLoUeJsjrivWsYZs0iR8jxmzYjPZmnYFNfDy');

INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (1, 'Северный', 'Ветер с севера. На путевом угле 130° даёт попутную составляющую около 0,64 скорости ветра и умеренный снос вправо. Время полёта Лондон–Париж сокращается.', 'rhumbs-north.jpg', 'rhumbs-north.mp4',
        'published'::rhumb_status, 0, '348.5',
        '2026-02-14 07:05:00+00', 4, '2026-02-14 08:00:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (2, 'Северо-восточный', 'Ветер с северо-востока. Угол к путевому близок к 95°, продольная составляющая почти нулевая. Время полёта меняется незначительно, основной эффект — боковой снос.', 'rhumbs-north-east.jpg', 'rhumbs-north-east.mp4',
        'published'::rhumb_status, 45, '33.5',
        '2026-02-14 07:20:00+00', 4, '2026-02-14 08:10:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (3, 'Восточный', 'Ветер с востока. Даёт встречную составляющую около 0,77 скорости ветра. Путевая скорость Boeing-737 NG падает, время полёта растёт.', 'rhumbs-east.jpg', 'rhumbs-east.mp4',
        'published'::rhumb_status, 90, '78.5',
        '2026-02-14 07:35:00+00', 5, '2026-02-14 08:25:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (4, 'Юго-восточный', 'Ветер с юго-востока, почти строго навстречу путевому углу 130°. Наихудший румб маршрута: встречная составляющая близка к полной скорости ветра, время полёта максимально.', 'rhumbs-south-east.jpg', 'rhumbs-south-east.mp4',
        'published'::rhumb_status, 135, '123.5',
        '2026-02-14 07:50:00+00', 5, '2026-02-14 08:40:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (5, 'Южный', 'Ветер с юга. Встречная составляющая около 0,64 скорости ветра при заметном сносе влево. Время полёта увеличивается умеренно.', 'rhumbs-south.jpg', 'rhumbs-south.mp4',
        'published'::rhumb_status, 180, '168.5',
        '2026-02-14 08:05:00+00', 6, '2026-02-14 08:55:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (6, 'Юго-западный', 'Ветер с юго-запада. Угол к путевому около 85°, продольная составляющая почти нулевая, слабо попутная. Румб удалён из каталога.', 'rhumbs-south-west.jpg', 'rhumbs-south-west.mp4',
        'deleted'::rhumb_status, 225, '213.5',
        '2026-02-14 08:20:00+00', 6, '2026-02-14 09:10:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (7, 'Западный', 'Ветер с запада. Попутная составляющая около 0,77 скорости ветра. Путевая скорость растёт, время полёта Лондон–Париж сокращается заметно.', 'rhumbs-west.jpg', 'rhumbs-west.mp4',
        'published'::rhumb_status, 270, '258.5',
        '2026-02-14 08:35:00+00', 4, '2026-02-14 09:25:00+00');
INSERT INTO rhumbs (id, name, description, image_key, video_key, status,
                    geographic_azimuth_deg, magnetic_azimuth_deg, created_at, creator_id, formed_at)
VALUES (8, 'Северо-западный', NULL, '', '',
        'draft'::rhumb_status, NULL, NULL,
        '2026-02-14 08:50:00+00', 5, NULL);

INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (1, 4, 1);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (2, 4, 4);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (3, 4, 7);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (4, 5, 1);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (5, 5, 3);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (6, 5, 5);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (7, 6, 1);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (8, 6, 3);
INSERT INTO rhumbs_likes (id, user_id, rhumb_id) VALUES (9, 6, 4);

SELECT setval('users_id_seq', 6, true);
SELECT setval('rhumbs_id_seq', 8, true);
SELECT setval('rhumbs_likes_id_seq', 9, true);

COMMIT;
