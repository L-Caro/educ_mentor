import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module accords : les séances jouées et la progression par notion.
 *
 * Le corpus morphologique n'est PAS en base : c'est du code (`accords.corpus.ts`). Ici
 * plus qu'ailleurs : la réponse attendue de l'enfant EST une orthographe, donc une forme
 * fausse saisie dans un textarea d'import deviendrait la bonne réponse.
 *
 * Réversible sans risque : les deux tables sont neuves, `down` ne détruit rien qui
 * préexistait.
 */
export class CreationAccords1788600000000 implements MigrationInterface {
  name = 'CreationAccords1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "accords_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "question_types" text, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    );
    await queryRunner.query(
      `CREATE TABLE "accords_progression" ("id" varchar PRIMARY KEY NOT NULL, "skill_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_accords_progression_skill_key" UNIQUE ("skill_key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "accords_progression"`);
    await queryRunner.query(`DROP TABLE "accords_sessions"`);
  }
}
