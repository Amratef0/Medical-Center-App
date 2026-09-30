import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReportIndexesAndJobSettings1790741100000 implements MigrationInterface {
  name = 'ReportIndexesAndJobSettings1790741100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sessions_session_date" ON "sessions" ("session_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_sessions_doctor_id" ON "sessions" ("doctor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_patients_referral_source" ON "patients" ("referral_source")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_patients_registration_date" ON "patients" ("registration_date")`,
    );

    await queryRunner.query(`
      INSERT INTO "system_settings" ("setting_key", "value") VALUES
        ('clinic.timezone', 'Asia/Riyadh'),
        ('sessions.missed_grace_minutes', '60'),
        ('package.renewal_window_days', '14')
      ON CONFLICT ("setting_key") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_patients_registration_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_patients_referral_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_doctor_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sessions_session_date"`);
  }
}
