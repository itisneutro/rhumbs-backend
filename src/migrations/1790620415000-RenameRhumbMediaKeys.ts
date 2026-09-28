import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRhumbMediaKeys1790620415000 implements MigrationInterface {
  name = 'RenameRhumbMediaKeys1790620415000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "image_url" TO "image_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "video_url" TO "video_key"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "video_key" TO "video_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "image_key" TO "image_url"`,
    );
  }
}
