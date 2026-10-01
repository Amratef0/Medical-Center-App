import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Baseline of the schema that already exists on databases created before
 * migrations existed. Generated 2026-09-30 against an empty database
 * (mcsos_schema_scratch), not by diffing a populated one.
 *
 * national_id_photo, national_id_front, and national_id_back are all present
 * on purpose. T-011 removes the redundancy in its own migration.
 *
 * Do not execute this file against a database that already has these tables.
 * Local DB_NAME already had these tables, so the row
 * InitialSchema1790740512591 / timestamp 1790740512591 was inserted into
 * "migrations" and the SQL was not run there.
 *
 * Railway was not updated from this machine: .env has no production connection
 * string. On the production database, after confirming its tables match this
 * file, insert the same row and do not run the migration:
 *   INSERT INTO migrations (timestamp, name)
 *   VALUES (1790740512591, 'InitialSchema1790740512591');
 */
export class InitialSchema1790740512591 implements MigrationInterface {
    name = 'InitialSchema1790740512591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Production (and any DB created before this file) already has the
        // baseline objects. Replaying CREATE TYPE crashes boot. Skip the SQL
        // and let TypeORM record this migration as applied.
        const alreadyThere = await queryRunner.query(
            `SELECT 1 FROM pg_type WHERE typname = 'users_role_enum'`,
        );
        if (alreadyThere.length > 0) {
            return;
        }

        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('RECEPTIONIST', 'OPERATIONS_MANAGER', 'DOCTOR', 'FINANCE', 'CUSTOMER_SUPPORT', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "refresh_token_hash" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "medical_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" uuid NOT NULL, "allergies" text, "chronic_diseases" text, "medications" text, "surgeries" text, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_346f79a689d013533a8b6f1c7d" UNIQUE ("patient_id"), CONSTRAINT "PK_8b0170de8abb52639e20c046533" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctor_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" uuid NOT NULL, "day_of_week" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "slot_capacity" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_71e296f0654f254ed30bf7b50c" CHECK ("day_of_week" BETWEEN 0 AND 6), CONSTRAINT "PK_3d2b4ffe9085f8c7f9f269aed89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('ATTENDED', 'ABSENT')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "status" "public"."attendance_status_enum" NOT NULL, "reason" text, "check_in_time" TIMESTAMP WITH TIME ZONE, "check_out_time" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_5940f7beb6d791a618dbf88361" UNIQUE ("session_id"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_368d83b661b9670e7be1bbb9cdd" UNIQUE ("code"), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sessions_session_type_enum" AS ENUM('ASSESSMENT', 'TREATMENT', 'FOLLOWUP', 'RE_ASSESSMENT')`);
        await queryRunner.query(`CREATE TYPE "public"."sessions_status_enum" AS ENUM('SCHEDULED', 'ATTENDED', 'MISSED', 'CANCELED')`);
        await queryRunner.query(`CREATE TYPE "public"."sessions_confirm_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'DECLINED')`);
        await queryRunner.query(`CREATE TABLE "sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" uuid NOT NULL, "doctor_id" uuid, "service_id" character varying, "slot_id" character varying, "treatment_plan_id" uuid, "patient_package_id" character varying, "session_type" "public"."sessions_session_type_enum" NOT NULL, "session_date" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."sessions_status_enum" NOT NULL DEFAULT 'SCHEDULED', "is_deducted" boolean NOT NULL DEFAULT false, "deducted_at" TIMESTAMP WITH TIME ZONE, "doctor_notes" text, "reception_notes" text, "absence_reason" text, "room_id" uuid, "confirm_status" "public"."sessions_confirm_status_enum" NOT NULL DEFAULT 'PENDING', "start_time" TIMESTAMP WITH TIME ZONE, "end_time" TIMESTAMP WITH TIME ZONE, "payment_verified" boolean NOT NULL DEFAULT false, "payment_verified_by" character varying, "payment_verified_at" TIMESTAMP WITH TIME ZONE, "scheduled_duration_minutes" integer NOT NULL DEFAULT '60', "actual_duration_minutes" integer, "duration_warning_generated" boolean NOT NULL DEFAULT false, "evaluation_report" text, "cancellation_reason" text, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancelled_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3238ef96f18b355b671619111bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "doctors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "specialization" character varying, "phone" character varying, "email" character varying, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8207e7889b50ee3695c2b8154ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treatment_plan_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treatment_plan_id" uuid NOT NULL, "service_id" character varying NOT NULL, "sessions_count" integer NOT NULL DEFAULT '1', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_cbf1a07d5136a704d97ed53473f" UNIQUE ("treatment_plan_id", "service_id"), CONSTRAINT "PK_07d50f1f1dbcff54a6c7e2e4776" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "treatment_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" uuid NOT NULL, "doctor_id" uuid, "assessed_by_doctor_id" character varying, "total_sessions" integer NOT NULL, "frequency" character varying, "status" character varying NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6372779b339933b56aa985167f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."patients_status_enum" AS ENUM('PENDING_ASSESSMENT', 'ASSESSMENT_COMPLETED', 'ASSESSMENT_DROPOFF')`);
        await queryRunner.query(`CREATE TABLE "patients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_code" character varying(50) NOT NULL, "profile_number" character varying(50), "first_name" character varying, "last_name" character varying, "full_name_ar" character varying, "gender" character varying, "date_of_birth" date, "nationality" character varying, "occupation" character varying, "address" character varying, "phone" character varying, "whatsapp_number" character varying, "referral_source" character varying, "referral_doctor_name" character varying, "referral_friend_name" character varying, "national_id_photo" text, "national_id_front" text, "national_id_back" text, "emergency_contact" character varying, "email" character varying, "status" "public"."patients_status_enum" NOT NULL DEFAULT 'PENDING_ASSESSMENT', "registration_date" date NOT NULL DEFAULT ('now'::text)::date, "notes" text, "created_by_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid, CONSTRAINT "UQ_72398f0b54d401540321d5db8bf" UNIQUE ("patient_code"), CONSTRAINT "UQ_8c339ed6439ca0455e31f29e968" UNIQUE ("profile_number"), CONSTRAINT "PK_a7f0b9fcbb3469d5ec0b0aceaa7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."waitlist_status_enum" AS ENUM('WAITING', 'ASSIGNED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "waitlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."waitlist_status_enum" NOT NULL DEFAULT 'WAITING', "patient_id" uuid NOT NULL, "service_id" character varying, "doctor_id" uuid, "preferred_date" date, "preferred_time" TIME, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_973cfbedc6381485681d6a6916c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."services_category_enum" AS ENUM('NEURO_PT', 'ORTHO_PT', 'PEDIATRIC_PT', 'SPEECH_THERAPY', 'NUTRITION', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "category" "public"."services_category_enum" NOT NULL DEFAULT 'GENERAL', "price" numeric(10,2), "duration" character varying, "price_package_6" numeric(10,2), "price_package_12" numeric(10,2), "notes" text, "sort_order" integer NOT NULL DEFAULT '100', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."schedule_slots_type_enum" AS ENUM('BULK', 'DYNAMIC')`);
        await queryRunner.query(`CREATE TABLE "schedule_slots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" character varying, "service_id" uuid, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE NOT NULL, "capacity" integer NOT NULL DEFAULT '1', "booked_count" integer NOT NULL DEFAULT '0', "type" "public"."schedule_slots_type_enum", "is_available" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_11236e5138891d4dd3cc8a8b564" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "package_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "package_id" uuid NOT NULL, "service_id" uuid NOT NULL, "session_count" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_51bf6320688f8e6e978b2f7c42c" UNIQUE ("package_id", "service_id"), CONSTRAINT "PK_0c19799a8fbfbc06701fe3b90fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "total_sessions" integer NOT NULL, "expiry_days" integer, "price" numeric(10,2), "is_custom" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."patient_packages_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'EXHAUSTED', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TYPE "public"."patient_packages_discount_type_enum" AS ENUM('fixed', 'percentage')`);
        await queryRunner.query(`CREATE TABLE "patient_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" character varying NOT NULL, "package_id" uuid NOT NULL, "status" "public"."patient_packages_status_enum" NOT NULL DEFAULT 'ACTIVE', "remaining_sessions" integer NOT NULL, "start_date" date, "end_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "discount_type" "public"."patient_packages_discount_type_enum", "discount_amount" numeric(10,2), "final_price" numeric(10,2), "notes" text, CONSTRAINT "PK_f9649d23916a19712895263a665" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('PACKAGE_ENDING_SOON', 'CAPACITY_LIMIT_REACHED', 'PAYMENT_VERIFIED', 'ASSESSMENT_ENDED_EARLIER', 'MISSED_APPOINTMENT', 'ATTENDANCE_RECORDED', 'DOCTOR_SCHEDULE_FULL', 'GENERAL')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'GENERAL', "title" character varying NOT NULL, "message" text NOT NULL, "target_role" character varying NOT NULL DEFAULT 'ALL', "is_read" boolean NOT NULL DEFAULT false, "reference_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."follow_up_tasks_type_enum" AS ENUM('DROP_OFF', 'MISSED_SESSION', 'RENEWAL')`);
        await queryRunner.query(`CREATE TYPE "public"."follow_up_tasks_status_enum" AS ENUM('PENDING', 'RESOLVED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "follow_up_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" character varying NOT NULL, "type" "public"."follow_up_tasks_type_enum", "message" text, "status" "public"."follow_up_tasks_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_59b8a8794c3c8b1c1f3a5bccd46" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."whatsapp_logs_status_enum" AS ENUM('PENDING', 'SENT', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "whatsapp_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" character varying, "followup_task_id" uuid, "phone_number" character varying NOT NULL, "template_name" character varying, "message_body" text, "status" "public"."whatsapp_logs_status_enum" NOT NULL DEFAULT 'PENDING', "sent_at" TIMESTAMP WITH TIME ZONE, "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf09d6935d3e7c0c38a6eefb849" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "purchase_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "po_number" character varying NOT NULL, "vendor_name" character varying NOT NULL, "description" text, "total_amount" numeric(10,2), "created_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_74065a5d2b8c4c14b8b8fcf0159" UNIQUE ("po_number"), CONSTRAINT "PK_05148947415204a897e8beb2553" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PAID', 'PENDING', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_approval_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "patient_id" character varying NOT NULL, "package_id" character varying, "patient_package_id" uuid, "amount" numeric(10,2) NOT NULL, "discount" numeric(10,2) NOT NULL DEFAULT '0', "discount_type" character varying, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "approval_status" "public"."payments_approval_status_enum" NOT NULL DEFAULT 'PENDING', "approved_by" character varying, "approved_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_number" character varying NOT NULL, "patient_id" character varying NOT NULL, "payment_id" uuid, "subtotal" numeric(10,2) NOT NULL, "discount" numeric(10,2) NOT NULL DEFAULT '0', "total_amount" numeric(10,2) NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'PENDING', "issued_at" TIMESTAMP WITH TIME ZONE DEFAULT now(), "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb" UNIQUE ("invoice_number"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED', 'PENDING')`);
        await queryRunner.query(`CREATE TYPE "public"."contracts_collection_status_enum" AS ENUM('NOT_STARTED', 'PARTIAL', 'FULLY_COLLECTED', 'OVERDUE', 'DISPUTED')`);
        await queryRunner.query(`CREATE TABLE "contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_name" character varying NOT NULL, "contact_person" character varying, "phone" character varying, "email" character varying, "address" text, "contract_number" character varying, "start_date" date NOT NULL, "end_date" date NOT NULL, "total_value" numeric(12,2) NOT NULL DEFAULT '0', "collected_amount" numeric(12,2) NOT NULL DEFAULT '0', "remaining_amount" numeric(12,2) NOT NULL DEFAULT '0', "discount_percentage" numeric(5,2) NOT NULL DEFAULT '0', "status" "public"."contracts_status_enum" NOT NULL DEFAULT 'PENDING', "collection_status" "public"."contracts_collection_status_enum" NOT NULL DEFAULT 'NOT_STARTED', "notes" text, "payment_terms" text, "covered_services" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_db84c172dc74e6271e614b68fbd" UNIQUE ("contract_number"), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contract_letters_letter_type_enum" AS ENUM('CONTRACT_OFFER', 'RENEWAL_NOTICE', 'INVOICE_LETTER', 'PAYMENT_REMINDER', 'SERVICE_REPORT', 'COMPLAINT', 'GENERAL')`);
        await queryRunner.query(`CREATE TYPE "public"."contract_letters_status_enum" AS ENUM('DRAFT', 'SENT', 'RECEIVED', 'ACKNOWLEDGED', 'PENDING_RESPONSE', 'RESPONDED', 'ARCHIVED')`);
        await queryRunner.query(`CREATE TABLE "contract_letters" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contract_id" uuid NOT NULL, "subject" character varying NOT NULL, "content" text, "letter_type" "public"."contract_letters_letter_type_enum" NOT NULL DEFAULT 'GENERAL', "status" "public"."contract_letters_status_enum" NOT NULL DEFAULT 'DRAFT', "letter_date" date NOT NULL, "received_date" date, "response_date" date, "reference_number" character varying, "document_path" character varying, "sender" character varying, "recipient" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aab18524dccc7290210516acd9b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "medical_histories" ADD CONSTRAINT "FK_346f79a689d013533a8b6f1c7dd" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" ADD CONSTRAINT "FK_2cc8d37cdcb4ecd1e726d6ed304" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_5940f7beb6d791a618dbf88361e" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_b53ef4073197ef9be0c1d914c54" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_348ee0ff980879d47e6e5c435c7" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_532e8a2a791fab92c9c535c007e" FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessions" ADD CONSTRAINT "FK_385ceb9a1f74fe2c97543f5453f" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treatment_plan_services" ADD CONSTRAINT "FK_69439f6d9853b5033445c2e32ad" FOREIGN KEY ("treatment_plan_id") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treatment_plans" ADD CONSTRAINT "FK_69e82223582d0bd8560c6271735" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "treatment_plans" ADD CONSTRAINT "FK_aff03fb05c1bf0495107b517c49" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_777f944408139b879496bef4495" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "waitlist" ADD CONSTRAINT "FK_ca3840a30103ecea5d01b16aaf0" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "waitlist" ADD CONSTRAINT "FK_e3c6aae1f57fddb942d9d47fefd" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "schedule_slots" ADD CONSTRAINT "FK_e2a60c7a13cafd8fc1d1827cc2d" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "package_services" ADD CONSTRAINT "FK_f30752478d9171c81d95b2754d8" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "package_services" ADD CONSTRAINT "FK_88a6b1f9641c4e6e37b385e20bb" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patient_packages" ADD CONSTRAINT "FK_c80246cb2c5d4b874867d580c33" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "FK_e2111412458532941523979618f" FOREIGN KEY ("followup_task_id") REFERENCES "follow_up_tasks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_bb418dc8408914b3f89b9254ce0" FOREIGN KEY ("patient_package_id") REFERENCES "patient_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_02781c49b25ceb502571f0315f6" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_letters" ADD CONSTRAINT "FK_b259f0b324aeff0936479b2343a" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_letters" DROP CONSTRAINT "FK_b259f0b324aeff0936479b2343a"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_02781c49b25ceb502571f0315f6"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_bb418dc8408914b3f89b9254ce0"`);
        await queryRunner.query(`ALTER TABLE "whatsapp_logs" DROP CONSTRAINT "FK_e2111412458532941523979618f"`);
        await queryRunner.query(`ALTER TABLE "patient_packages" DROP CONSTRAINT "FK_c80246cb2c5d4b874867d580c33"`);
        await queryRunner.query(`ALTER TABLE "package_services" DROP CONSTRAINT "FK_88a6b1f9641c4e6e37b385e20bb"`);
        await queryRunner.query(`ALTER TABLE "package_services" DROP CONSTRAINT "FK_f30752478d9171c81d95b2754d8"`);
        await queryRunner.query(`ALTER TABLE "schedule_slots" DROP CONSTRAINT "FK_e2a60c7a13cafd8fc1d1827cc2d"`);
        await queryRunner.query(`ALTER TABLE "waitlist" DROP CONSTRAINT "FK_e3c6aae1f57fddb942d9d47fefd"`);
        await queryRunner.query(`ALTER TABLE "waitlist" DROP CONSTRAINT "FK_ca3840a30103ecea5d01b16aaf0"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_777f944408139b879496bef4495"`);
        await queryRunner.query(`ALTER TABLE "treatment_plans" DROP CONSTRAINT "FK_aff03fb05c1bf0495107b517c49"`);
        await queryRunner.query(`ALTER TABLE "treatment_plans" DROP CONSTRAINT "FK_69e82223582d0bd8560c6271735"`);
        await queryRunner.query(`ALTER TABLE "treatment_plan_services" DROP CONSTRAINT "FK_69439f6d9853b5033445c2e32ad"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_385ceb9a1f74fe2c97543f5453f"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_532e8a2a791fab92c9c535c007e"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_348ee0ff980879d47e6e5c435c7"`);
        await queryRunner.query(`ALTER TABLE "sessions" DROP CONSTRAINT "FK_b53ef4073197ef9be0c1d914c54"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_5940f7beb6d791a618dbf88361e"`);
        await queryRunner.query(`ALTER TABLE "doctor_availability" DROP CONSTRAINT "FK_2cc8d37cdcb4ecd1e726d6ed304"`);
        await queryRunner.query(`ALTER TABLE "medical_histories" DROP CONSTRAINT "FK_346f79a689d013533a8b6f1c7dd"`);
        await queryRunner.query(`DROP TABLE "contract_letters"`);
        await queryRunner.query(`DROP TYPE "public"."contract_letters_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contract_letters_letter_type_enum"`);
        await queryRunner.query(`DROP TABLE "contracts"`);
        await queryRunner.query(`DROP TYPE "public"."contracts_collection_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_approval_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_orders"`);
        await queryRunner.query(`DROP TABLE "whatsapp_logs"`);
        await queryRunner.query(`DROP TYPE "public"."whatsapp_logs_status_enum"`);
        await queryRunner.query(`DROP TABLE "follow_up_tasks"`);
        await queryRunner.query(`DROP TYPE "public"."follow_up_tasks_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."follow_up_tasks_type_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "patient_packages"`);
        await queryRunner.query(`DROP TYPE "public"."patient_packages_discount_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."patient_packages_status_enum"`);
        await queryRunner.query(`DROP TABLE "packages"`);
        await queryRunner.query(`DROP TABLE "package_services"`);
        await queryRunner.query(`DROP TABLE "schedule_slots"`);
        await queryRunner.query(`DROP TYPE "public"."schedule_slots_type_enum"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TYPE "public"."services_category_enum"`);
        await queryRunner.query(`DROP TABLE "waitlist"`);
        await queryRunner.query(`DROP TYPE "public"."waitlist_status_enum"`);
        await queryRunner.query(`DROP TABLE "patients"`);
        await queryRunner.query(`DROP TYPE "public"."patients_status_enum"`);
        await queryRunner.query(`DROP TABLE "treatment_plans"`);
        await queryRunner.query(`DROP TABLE "treatment_plan_services"`);
        await queryRunner.query(`DROP TABLE "doctors"`);
        await queryRunner.query(`DROP TABLE "sessions"`);
        await queryRunner.query(`DROP TYPE "public"."sessions_confirm_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessions_session_type_enum"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP TABLE "doctor_availability"`);
        await queryRunner.query(`DROP TABLE "medical_histories"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
