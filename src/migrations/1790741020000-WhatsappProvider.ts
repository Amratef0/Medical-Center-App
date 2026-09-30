import { MigrationInterface, QueryRunner } from 'typeorm';

export class WhatsappProvider1790741020000 implements MigrationInterface {
  name = 'WhatsappProvider1790741020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."whatsapp_logs_status_enum" ADD VALUE IF NOT EXISTS 'MOCK'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."whatsapp_logs_status_enum" ADD VALUE IF NOT EXISTS 'QUEUED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."whatsapp_logs_status_enum" ADD VALUE IF NOT EXISTS 'DELIVERED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."whatsapp_logs_status_enum" ADD VALUE IF NOT EXISTS 'READ'`,
    );

    await queryRunner.query(
      `ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "scheduled_for" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "provider_message_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "attempt_count" integer NOT NULL DEFAULT 0`,
    );

    // Move abused error_message schedule stamps into scheduled_for when parseable
    await queryRunner.query(`
      UPDATE "whatsapp_logs"
      SET "scheduled_for" = CASE
            WHEN "error_message" ~ '^Scheduled for:\\s*\\d{4}-'
            THEN nullif(substring("error_message" from 'Scheduled for:\\s*(.*)'), '')::timestamptz
            ELSE NULL
          END,
          "error_message" = CASE
            WHEN "error_message" LIKE 'Scheduled for:%' THEN NULL
            ELSE "error_message"
          END
      WHERE "status" = 'PENDING'
        AND "error_message" LIKE 'Scheduled for:%'
        AND "scheduled_for" IS NULL
    `);

    await queryRunner.query(
      `ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "whatsapp_opt_out" boolean NOT NULL DEFAULT false`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "whatsapp_templates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name_ar" character varying NOT NULL,
        "name_en" character varying NOT NULL,
        "provider_template_name" character varying,
        "message_ar" text NOT NULL,
        "message_en" text NOT NULL,
        "variables" text NOT NULL DEFAULT '',
        "approval_status" character varying NOT NULL DEFAULT 'draft',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "whatsapp_flows" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name_ar" character varying NOT NULL,
        "name_en" character varying NOT NULL,
        "message" text NOT NULL,
        "delay" integer NOT NULL DEFAULT 24,
        "delay_unit" character varying NOT NULL DEFAULT 'hours',
        "enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      INSERT INTO "whatsapp_templates"
        ("name_ar", "name_en", "provider_template_name", "message_ar", "message_en", "variables", "approval_status")
      SELECT * FROM (VALUES
        ('تذكير بموعد', 'Appointment Reminder', 'appointment_reminder',
         'تذكير بموعدك مع د. {doctor} يوم {date} الساعة {time}',
         'Reminder for your appointment with Dr. {doctor} on {date} at {time}',
         'doctor,date,time', 'draft'),
        ('تأكيد موعد', 'Appointment Confirmation', 'appointment_confirmation',
         'تم تأكيد موعدك مع د. {doctor} يوم {date} الساعة {time}',
         'Your appointment with Dr. {doctor} on {date} at {time} has been confirmed',
         'doctor,date,time', 'draft'),
        ('تأكيد دفع', 'Payment Confirmation', 'payment_confirmation',
         'تم تأكيد دفع مبلغ {amount} عن الفاتورة {invoice}',
         'Payment of {amount} for invoice {invoice} has been confirmed',
         'amount,invoice', 'draft')
      ) AS v(name_ar, name_en, provider_template_name, message_ar, message_en, variables, approval_status)
      WHERE NOT EXISTS (SELECT 1 FROM "whatsapp_templates" LIMIT 1)
    `);

    await queryRunner.query(`
      INSERT INTO "whatsapp_flows"
        ("name_ar", "name_en", "message", "delay", "delay_unit", "enabled")
      SELECT * FROM (VALUES
        ('تذكير بالموعد', 'Appointment Reminder',
         'تذكير بموعدك مع د. {doctor} يوم {date} الساعة {time}', 24, 'hours', true),
        ('متابعة ما بعد الموعد', 'Post-Appointment Follow-up',
         'كيف كانت تجربتك مع د. {doctor}؟', 2, 'days', true),
        ('تأكيد الحضور', 'Attendance Confirmation',
         'يرجى تأكيد حضورك للموعد مع د. {doctor} يوم {date}', 48, 'hours', false)
      ) AS v(name_ar, name_en, message, delay, delay_unit, enabled)
      WHERE NOT EXISTS (SELECT 1 FROM "whatsapp_flows" LIMIT 1)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "whatsapp_flows"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "whatsapp_templates"`);
    await queryRunner.query(
      `ALTER TABLE "patients" DROP COLUMN IF EXISTS "whatsapp_opt_out"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_logs" DROP COLUMN IF EXISTS "attempt_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_logs" DROP COLUMN IF EXISTS "provider_message_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_logs" DROP COLUMN IF EXISTS "scheduled_for"`,
    );
    // Enum values cannot be removed safely in Postgres without recreating the type.
  }
}
