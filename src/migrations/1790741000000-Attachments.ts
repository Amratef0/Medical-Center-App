import { MigrationInterface, QueryRunner } from 'typeorm';

export class Attachments1790741000000 implements MigrationInterface {
  name = 'Attachments1790741000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "attachments" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "owner_type" character varying(32) NOT NULL,
      "owner_id" uuid NOT NULL,
      "kind" character varying(64) NOT NULL,
      "storage_key" character varying(512) NOT NULL,
      "mime_type" character varying(128) NOT NULL,
      "size_bytes" integer NOT NULL,
      "uploaded_by" uuid,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_attachments" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_attachments_owner" ON "attachments" ("owner_type", "owner_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_attachments_owner"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
  }
}
