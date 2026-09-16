import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRhumbsTables1789582433460 implements MigrationInterface {
    name = 'CreateRhumbsTables1789582433460'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "login" character varying(64) NOT NULL, "password" character varying(128) NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rhumb_status" AS ENUM('draft', 'published', 'deleted')`);
        await queryRunner.query(`CREATE TABLE "rhumbs" ("id" SERIAL NOT NULL, "name" character varying(64) NOT NULL, "description" character varying(512), "image_url" character varying(256) NOT NULL DEFAULT '', "video_url" character varying(256) NOT NULL DEFAULT '', "status" "public"."rhumb_status" NOT NULL, "geographic_azimuth_deg" smallint, "magnetic_azimuth_deg" numeric(4,1), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creator_id" integer NOT NULL, "formed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e09f104aa47da8827aab57b559e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rhumbs_likes" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "rhumb_id" integer NOT NULL, CONSTRAINT "uq_rhumbs_likes_user_rhumb" UNIQUE ("user_id", "rhumb_id"), CONSTRAINT "PK_ef9d2e1d6a79cb3ec32da7d8718" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rhumbs" ADD CONSTRAINT "FK_cadf67ddc3598331e06f951438a" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rhumbs_likes" ADD CONSTRAINT "FK_8494f55ba594efd0afa7f8feb3c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rhumbs_likes" ADD CONSTRAINT "FK_dd6a8ea88734b45911495341b91" FOREIGN KEY ("rhumb_id") REFERENCES "rhumbs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rhumbs_likes" DROP CONSTRAINT "FK_dd6a8ea88734b45911495341b91"`);
        await queryRunner.query(`ALTER TABLE "rhumbs_likes" DROP CONSTRAINT "FK_8494f55ba594efd0afa7f8feb3c"`);
        await queryRunner.query(`ALTER TABLE "rhumbs" DROP CONSTRAINT "FK_cadf67ddc3598331e06f951438a"`);
        await queryRunner.query(`DROP TABLE "rhumbs_likes"`);
        await queryRunner.query(`DROP TABLE "rhumbs"`);
        await queryRunner.query(`DROP TYPE "public"."rhumb_status"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
