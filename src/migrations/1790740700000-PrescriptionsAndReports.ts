import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Prescriptions and chart reports. Patient reports live in this migration
 * because they belong to the same clinical record as a prescription, and
 * medical_histories is a single row per patient, not a list of reports.
 */
export class PrescriptionsAndReports1790740700000 implements MigrationInterface {
  name = 'PrescriptionsAndReports1790740700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "prescriptions" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "patient_id" uuid NOT NULL,
      "doctor_id" uuid,
      "session_id" uuid,
      "medications" jsonb NOT NULL DEFAULT '[]',
      "attachment_ref" character varying,
      "notes" text,
      "status" character varying NOT NULL DEFAULT 'active',
      "prescribed_on" character varying,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_prescriptions" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_prescriptions_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_prescriptions_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_prescriptions_session" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL`,
    );
    await queryRunner.query(`CREATE TABLE "patient_reports" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "patient_id" uuid NOT NULL,
      "title" character varying NOT NULL,
      "content" text NOT NULL DEFAULT '',
      "report_type" character varying NOT NULL DEFAULT 'medical',
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_patient_reports" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `ALTER TABLE "patient_reports" ADD CONSTRAINT "FK_patient_reports_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "patient_reports" DROP CONSTRAINT "FK_patient_reports_patient"`);
    await queryRunner.query(`DROP TABLE "patient_reports"`);
    await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_prescriptions_session"`);
    await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_prescriptions_doctor"`);
    await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_prescriptions_patient"`);
    await queryRunner.query(`DROP TABLE "prescriptions"`);
  }
}
