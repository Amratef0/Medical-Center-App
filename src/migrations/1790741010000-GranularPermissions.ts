import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DEFAULT_ROLE_GRANTS,
  PERMISSION_CATALOGUE,
} from '../modules/permissions/permission-catalogue';

export class GranularPermissions1790741010000 implements MigrationInterface {
  name = 'GranularPermissions1790741010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "key" character varying(128) NOT NULL,
        "description_ar" text NOT NULL,
        "description_en" text NOT NULL,
        CONSTRAINT "PK_permissions" PRIMARY KEY ("key")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role" "public"."users_role_enum" NOT NULL,
        "permission_key" character varying(128) NOT NULL,
        "granted" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role", "permission_key"),
        CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_key")
          REFERENCES "permissions"("key") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_permissions" (
        "user_id" uuid NOT NULL,
        "permission_key" character varying(128) NOT NULL,
        "granted" boolean NOT NULL,
        "granted_by" uuid,
        "granted_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("user_id", "permission_key"),
        CONSTRAINT "FK_user_permissions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_user_permissions_permission" FOREIGN KEY ("permission_key")
          REFERENCES "permissions"("key") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    for (const p of PERMISSION_CATALOGUE) {
      await queryRunner.query(
        `INSERT INTO "permissions" ("key", "description_ar", "description_en") VALUES ($1, $2, $3)`,
        [p.key, p.description_ar, p.description_en],
      );
    }

    for (const [role, keys] of Object.entries(DEFAULT_ROLE_GRANTS)) {
      const grantedSet = new Set(keys);
      for (const p of PERMISSION_CATALOGUE) {
        await queryRunner.query(
          `INSERT INTO "role_permissions" ("role", "permission_key", "granted") VALUES ($1, $2, $3)`,
          [role, p.key, grantedSet.has(p.key)],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_permissions"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
