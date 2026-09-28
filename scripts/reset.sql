BEGIN;

DELETE FROM rhumbs_likes WHERE rhumb_id > 8;
DELETE FROM rhumbs WHERE id > 8;
DELETE FROM rhumbs_likes WHERE user_id > 6;
DELETE FROM users WHERE id > 6;

UPDATE users SET password = '$2b$10$9t./3.aXgm9dpFliELxlq.GuP4FTJ/zaYizl4CgbN6H/Nxnbq4wTm' WHERE id = 4;
UPDATE users SET password = '$2b$10$lXElNIDfMEmfOn0sBMFv6OecSohSVexfRjtGClFdfBbNogyGnRry.' WHERE id = 5;
UPDATE users SET password = '$2b$10$/qmAexUtFRsGAv6D2YLoUeJsjrivWsYZs0iR8jxmzYjPZmnYFNfDy' WHERE id = 6;

UPDATE rhumbs SET status = 'published'::rhumb_status WHERE id IN (1, 2, 3, 4, 5, 7);
UPDATE rhumbs SET status = 'deleted'::rhumb_status   WHERE id = 6;
UPDATE rhumbs SET status = 'draft'::rhumb_status     WHERE id = 8;

UPDATE rhumbs AS r
   SET geographic_azimuth_deg = s.geo,
       magnetic_azimuth_deg = s.mag
  FROM (VALUES (1,   0, 348.5), (2,  45,  33.5), (3,  90,  78.5), (4, 135, 123.5),
               (5, 180, 168.5), (6, 225, 213.5), (7, 270, 258.5)) AS s (id, geo, mag)
 WHERE r.id = s.id;

UPDATE rhumbs
   SET creator_id = 5,
       description = NULL,
       geographic_azimuth_deg = NULL,
       magnetic_azimuth_deg = NULL,
       formed_at = NULL,
       image_key = '',
       video_key = ''
 WHERE id = 8;

SELECT setval('users_id_seq', 6, true);
SELECT setval('rhumbs_id_seq', 8, true);
SELECT setval('rhumbs_likes_id_seq', 9, true);

COMMIT;
