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
