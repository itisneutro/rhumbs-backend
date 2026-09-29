import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRhumbsNames1790708868000 implements MigrationInterface {
  name = 'RenameRhumbsNames1790708868000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "rhumb_status" RENAME TO "rhumbs_status"`);
    await queryRunner.query(
      `ALTER TABLE "rhumbs_likes" RENAME COLUMN "rhumb_id" TO "rhumbs_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs_likes" RENAME CONSTRAINT "uq_rhumbs_likes_user_rhumb" TO "uq_rhumbs_likes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs_likes" RENAME CONSTRAINT "rhumbs_likes_rhumb_id_not_null" TO "rhumbs_likes_rhumbs_id_not_null"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME CONSTRAINT "rhumbs_image_url_not_null" TO "rhumbs_image_key_not_null"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME CONSTRAINT "rhumbs_video_url_not_null" TO "rhumbs_video_key_not_null"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME CONSTRAINT "rhumbs_video_key_not_null" TO "rhumbs_video_url_not_null"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME CONSTRAINT "rhumbs_image_key_not_null" TO "rhumbs_image_url_not_null"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs_likes" RENAME CONSTRAINT "rhumbs_likes_rhumbs_id_not_null" TO "rhumbs_likes_rhumb_id_not_null"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs_likes" RENAME CONSTRAINT "uq_rhumbs_likes" TO "uq_rhumbs_likes_user_rhumb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs_likes" RENAME COLUMN "rhumbs_id" TO "rhumb_id"`,
    );
    await queryRunner.query(`ALTER TYPE "rhumbs_status" RENAME TO "rhumb_status"`);
  }
}
