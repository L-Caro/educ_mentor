import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module géométrie : les séances jouées et la progression par forme (ou par
 * paire, pour les questions « propriétés »). Le catalogue de formes lui-même n'est pas en
 * base : c'est du code (`geometrie.shapes.ts`), pas du contenu à éditer.
 *
 * Réversible sans risque : les deux tables sont neuves, `down` ne détruit rien qui
 * préexistait.
 */
export class CreationGeometrie1788400000000 implements MigrationInterface {
  name = 'CreationGeometrie1788400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "geometrie_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "question_types" text, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    );
    await queryRunner.query(
      `CREATE TABLE "geometrie_progression" ("id" varchar PRIMARY KEY NOT NULL, "skill_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_geometrie_progression_skill_key" UNIQUE ("skill_key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "geometrie_progression"`);
    await queryRunner.query(`DROP TABLE "geometrie_sessions"`);
  }
}
