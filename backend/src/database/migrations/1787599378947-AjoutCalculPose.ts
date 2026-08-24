import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute les deux tables du module de calcul posé.
 *
 * Première migration générée depuis les entités, après la migration de référence. Elle est
 * réversible sans risque : les deux tables sont neuves, `down` ne peut donc rien détruire
 * qui préexistait.
 */
export class AjoutCalculPose1787599378947 implements MigrationInterface {
  name = 'AjoutCalculPose1787599378947';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "pose_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "operations" varchar, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    );
    await queryRunner.query(
      `CREATE TABLE "pose_progression" ("id" varchar PRIMARY KEY NOT NULL, "skill_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_9e332442c492236478b71bc547b" UNIQUE ("skill_key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pose_progression"`);
    await queryRunner.query(`DROP TABLE "pose_sessions"`);
  }
}
