-- Сброс к состоянию сида перед демонстрацией.
-- Запускается на уже засеянной базе, миграцию не трогает.

BEGIN;

-- всё, что создано сверх сида, вместе с лайками на эти румбы
DELETE FROM rhumbs_likes WHERE rhumb_id > 8;
DELETE FROM rhumbs WHERE id > 8;

-- статусы возвращаются к сидовым
UPDATE rhumbs SET status = 'published'::rhumb_status WHERE id IN (1, 2, 3, 4, 5, 7);
UPDATE rhumbs SET status = 'deleted'::rhumb_status   WHERE id = 6;
UPDATE rhumbs SET status = 'draft'::rhumb_status     WHERE id = 8;

-- азимуты возвращаются к сидовым: магнитный = (географический − 11,5) по модулю 360
UPDATE rhumbs AS r
   SET geographic_azimuth_deg = s.geo,
       magnetic_azimuth_deg = s.mag
  FROM (VALUES (1,   0, 348.5), (2,  45,  33.5), (3,  90,  78.5), (4, 135, 123.5),
               (5, 180, 168.5), (6, 225, 213.5), (7, 270, 258.5)) AS s (id, geo, mag)
 WHERE r.id = s.id;

-- черновик снова пустой и снова у пользователя 5: без описания, без азимутов,
-- без даты формирования, url пустыми строками, чтобы показывались заглушки
UPDATE rhumbs
   SET creator_id = 5,
       description = NULL,
       geographic_azimuth_deg = NULL,
       magnetic_azimuth_deg = NULL,
       formed_at = NULL,
       image_url = '',
       video_url = ''
 WHERE id = 8;

-- последовательности возвращаются на сидовые значения
SELECT setval('rhumbs_id_seq', 8, true);
SELECT setval('rhumbs_likes_id_seq', 9, true);

COMMIT;
