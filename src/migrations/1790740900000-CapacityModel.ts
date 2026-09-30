import { MigrationInterface, QueryRunner } from 'typeorm';

export class CapacityModel1790740900000 implements MigrationInterface {
  name = 'CapacityModel1790740900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "doctors" ADD "max_sessions_per_day" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD "max_concurrent_sessions" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(`
      INSERT INTO "system_settings" ("setting_key", "value") VALUES
        ('capacity.center.max_sessions_per_day', ''),
        ('capacity.warn_threshold_pct', '80'),
        ('capacity.full_threshold_pct', '100')
      ON CONFLICT ("setting_key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "system_settings" WHERE "setting_key" IN (
        'capacity.center.max_sessions_per_day',
        'capacity.warn_threshold_pct',
        'capacity.full_threshold_pct'
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP COLUMN "max_concurrent_sessions"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctors" DROP COLUMN "max_sessions_per_day"`,
    );
  }
}
