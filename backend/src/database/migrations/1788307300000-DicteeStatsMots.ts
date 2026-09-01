import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Suivi par mot du module dictée : une ligne par mot rencontré, avec le compte des
 * réussites et des ratés cumulés sur l'année.
 *
 * Réversible sans risque : table neuve, `down` ne détruit rien qui préexistait.
 */
export class DicteeStatsMots1788307300000 implements MigrationInterface {
  name = 'DicteeStatsMots1788307300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "dictee_word_stats" ("word_key" varchar PRIMARY KEY NOT NULL, "display" text NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "dictee_word_stats"`);
  }
}
