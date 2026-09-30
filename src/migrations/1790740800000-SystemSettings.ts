import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemSettings1790740800000 implements MigrationInterface {
  name = 'SystemSettings1790740800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "system_settings" (
      "setting_key" character varying NOT NULL,
      "value" text NOT NULL,
      CONSTRAINT "PK_system_settings" PRIMARY KEY ("setting_key")
    )`);
    await queryRunner.query(
      `INSERT INTO "system_settings" ("setting_key", "value") VALUES ('package_sessions_threshold', '3')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_settings"`);
  }
}
