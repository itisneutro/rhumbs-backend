import { MigrationInterface, QueryRunner } from 'typeorm';

export class RhumbsStatusAsVarchar1790782284000 implements MigrationInterface {
  name = 'RhumbsStatusAsVarchar1790782284000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" ALTER COLUMN "status" TYPE character varying(16) USING "status"::text`,
    );
    await queryRunner.query(`DROP TYPE "rhumbs_status"`);
    await queryRunner.query(
      `ALTER TABLE "rhumbs" ADD CONSTRAINT "chk_rhumbs_status" CHECK ("status" IN ('draft', 'published', 'deleted'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rhumbs" DROP CONSTRAINT "chk_rhumbs_status"`,
    );
    await queryRunner.query(
      `CREATE TYPE "rhumbs_status" AS ENUM('draft', 'published', 'deleted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "rhumbs" ALTER COLUMN "status" TYPE "rhumbs_status" USING "status"::"rhumbs_status"`,
    );
  }
}
