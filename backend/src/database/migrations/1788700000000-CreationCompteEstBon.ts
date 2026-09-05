import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Tables du module « Le compte est bon » : les séances jouées et la progression.
 *
 * Aucune table de contenu, et ici c'est structurel plus que par choix : il n'y a pas de
 * corpus. Chaque tirage est ENGENDRÉ à la demande, à l'envers, depuis une suite
 * d'opérations valides (`compte.generator.ts`). Stocker des tirages n'apporterait qu'un
 * moyen d'en enregistrer d'insolubles.
 *
 * Réversible sans risque : les deux tables sont neuves, `down` ne détruit rien qui
 * préexistait.
 *
 * Le nom haché de la contrainte UNIQUE n'est pas une coquetterie : c'est celui que
 * TypeORM dérive de l'entité, et `npm run db:check` compare les deux textes de création
 * littéralement. Un nom lisible écrit à la main — comme dans les migrations d'accords, de
 * géométrie et de grammaire — y apparaît pour toujours comme un « écart », alors que les
 * colonnes et l'unicité sont identiques. Trois fausses alertes suffisent : celle-ci est
 * le quatrième cas, et le seul qu'on puisse encore éviter sans reconstruire une table.
 */
export class CreationCompteEstBon1788700000000 implements MigrationInterface {
  name = 'CreationCompteEstBon1788700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "compte_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "operations" varchar, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    );
    await queryRunner.query(
      `CREATE TABLE "compte_progression" ("id" varchar PRIMARY KEY NOT NULL, "skill_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_f1784007a2dbefd9572eda7d950" UNIQUE ("skill_key"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "compte_progression"`);
    await queryRunner.query(`DROP TABLE "compte_sessions"`);
  }
}
