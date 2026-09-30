import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShortenRhumbsAzimuths1790782778000 implements MigrationInterface {
  name = 'ShortenRhumbsAzimuths1790782778000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "geographic_azimuth_deg" TO "geo_azimuth"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "magnetic_azimuth_deg" TO "mag_azimuth"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "mag_azimuth" TO "magnetic_azimuth_deg"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" RENAME COLUMN "geo_azimuth" TO "geographic_azimuth_deg"`,
    );
  }
}
