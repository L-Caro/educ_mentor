import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module grammaire : les séances jouées et la progression par notion.
 *
 * Le corpus de phrases annotées n'est PAS en base — c'est du code
 * (`grammaire.corpus.ts`), pour la même raison que le catalogue de formes de la
 * géométrie : une phrase annotée mot par mot n'est pas du contenu qu'on édite, et une
 * annotation fausse enseignerait du faux français.
 *
 * Réversible sans risque : les deux tables sont neuves, `down` ne détruit rien qui
 * préexistait.
 */
export class CreationGrammaire1788500000000 implements MigrationInterface {
  name = 'CreationGrammaire1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "grammaire_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "question_types" text, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    );
    await queryRunner.query(
      `CREATE TABLE "grammaire_progression" ("id" varchar PRIMARY KEY NOT NULL, "skill_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_grammaire_progression_skill_key" UNIQUE ("skill_key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "grammaire_progression"`);
    await queryRunner.query(`DROP TABLE "grammaire_sessions"`);
  }
}
