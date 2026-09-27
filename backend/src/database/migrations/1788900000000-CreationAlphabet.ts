import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La seule table du module « Ordre alphabétique » : les mots retirés du référentiel.
 *
 * Aucune table de CONTENU. Les vingt-neuf mille mots vivent dans un fichier JSON produit
 * par `scripts/generate-mots-alphabet.mjs` depuis Lexique 3.83. Les mettre en base
 * n'apporterait qu'un endroit de plus où les modifier à la main, alors qu'ils sont
 * dérivés : la prochaine génération écraserait la retouche.
 *
 * Aucune table de progression non plus. Ce qui fait la difficulté ici est un RÉGLAGE, la
 * profondeur de comparaison, et non une notion qu'on acquiert : il n'y a rien à suivre
 * par mot, et suivre « la deuxième lettre » n'aurait pas de sens.
 *
 * Le nom haché de la contrainte UNIQUE est celui que TypeORM dérive de l'entité : la
 * migration a été produite par `migration:generate`, et non écrite à la main, pour que
 * `npm run db:check` ne signale pas un faux écart (voir la migration du compte est bon).
 *
 * Réversible sans risque : la table est neuve, `down` ne détruit rien qui préexistait.
 */
export class CreationAlphabet1788900000000 implements MigrationInterface {
  name = 'CreationAlphabet1788900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alphabet_mots_exclus" ("id" varchar PRIMARY KEY NOT NULL, "mot" varchar NOT NULL, "exclu_le" datetime NOT NULL, CONSTRAINT "UQ_061d8167c2deefa0f1f4a888f30" UNIQUE ("mot"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "alphabet_mots_exclus"`);
  }
}
