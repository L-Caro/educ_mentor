import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module dictée : le contenu importé (`dictee_items`) et les séances jouées
 * (`dictee_sessions`). Le suivi par mot arrive dans une migration suivante.
 *
 * Réversible sans risque : les deux tables sont neuves, `down` ne détruit rien qui
 * préexistait. Le contenu est inséré via l'import admin, pas par un seed.
 */
export class CreationDictee1788307200000 implements MigrationInterface {
  name = 'CreationDictee1788307200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dictee_items" ("id" varchar PRIMARY KEY NOT NULL, "niveau" text NOT NULL, "contenu" text NOT NULL, "notions" text NOT NULL, "is_active" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE TABLE "dictee_sessions" ("id" varchar PRIMARY KEY NOT NULL, "niveau" text NOT NULL, "item_ids" text NOT NULL, "notion" text, "preparee" boolean NOT NULL DEFAULT (0), "wrong_words" text, "total_words" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dictee_sessions"`);
    await queryRunner.query(`DROP TABLE "dictee_items"`);
  }
}
