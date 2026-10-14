import { MigrationInterface, QueryRunner } from 'typeorm';

export class AssessmentServiceFlow1790741200000 implements MigrationInterface {
  name = 'AssessmentServiceFlow1790741200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD "is_assessment" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD "session_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_packages" ADD "payment_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "patient_packages" SET "payment_verified" = true`,
    );
    await queryRunner.query(`
      CREATE TABLE "patient_package_services" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "patient_package_id" uuid NOT NULL,
        "service_id" uuid NOT NULL,
        "session_count" integer NOT NULL DEFAULT 0,
        "remaining_sessions" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_patient_package_services" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patient_package_services_pair" UNIQUE ("patient_package_id", "service_id"),
        CONSTRAINT "FK_pps_patient_package" FOREIGN KEY ("patient_package_id") REFERENCES "patient_packages"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_pps_service" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      INSERT INTO "patient_package_services" ("patient_package_id", "service_id", "session_count", "remaining_sessions")
      SELECT pp.id, ps.service_id, ps.session_count, ps.session_count
      FROM "patient_packages" pp
      INNER JOIN "package_services" ps ON ps.package_id = pp.package_id
    `);
    await queryRunner.query(`
      INSERT INTO "services" ("name", "category", "price", "is_assessment", "is_active", "sort_order")
      SELECT 'تقييم', 'GENERAL', 0, true, true, 1
      WHERE NOT EXISTS (SELECT 1 FROM "services" WHERE "is_assessment" = true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "patient_package_services"`);
    await queryRunner.query(`ALTER TABLE "patient_packages" DROP COLUMN "payment_verified"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "session_id"`);
    await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "is_assessment"`);
  }
}
