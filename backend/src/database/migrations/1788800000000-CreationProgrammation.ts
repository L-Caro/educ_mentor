import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La table du module « Programmation » : une ligne par parcours, et c'est tout.
 *
 * Aucune table de CONTENU. Les niveaux sont engendrés à la demande côté navigateur, avec
 * la même règle que les tirages du compte est bon : solubles par construction. Les
 * stocker n'apporterait qu'un moyen d'en enregistrer d'insolubles, et il faudrait un
 * éditeur pour les saisir.
 *
 * Aucune table de progression au sens des autres modules non plus : il n'y a ni maîtrise,
 * ni bonnes et mauvaises réponses à compter. Un jeu à niveaux n'a besoin que de savoir où
 * l'on s'était arrêté.
 *
 * Le nom haché de la contrainte UNIQUE est celui que TypeORM dérive de l'entité, et non
 * un nom lisible écrit à la main : `npm run db:check` compare les deux textes de création
 * littéralement, et un nom choisi apparaîtrait pour toujours comme un écart. La migration
 * a donc été produite par `migration:generate` plutôt qu'écrite.
 *
 * Réversible sans risque : la table est neuve, `down` ne détruit rien qui préexistait.
 */
export class CreationProgrammation1788800000000 implements MigrationInterface {
  name = 'CreationProgrammation1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "programmation_progression" ("id" varchar PRIMARY KEY NOT NULL, "parcours" varchar NOT NULL, "etape_atteinte" integer NOT NULL DEFAULT (0), "niveaux_reussis" integer NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_80d5a64f3b1f2f388f4b63f196c" UNIQUE ("parcours"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "programmation_progression"`);
  }
}
