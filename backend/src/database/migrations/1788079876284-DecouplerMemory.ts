import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Table du pool de cartes propre au jeu Memory. Jusqu'ici, Memory tirait ses cartes de
 * `imagier_words` (le module anglais) ; il devient autonome, avec ses propres images.
 *
 * Réversible sans risque : la table est neuve, `down` ne détruit rien qui préexistait.
 * Les lignes sont insérées au premier démarrage depuis `memory-card.seed.json`.
 */
export class DecouplerMemory1788079876284 implements MigrationInterface {
  name = 'DecouplerMemory1788079876284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "memory_cards" ("id" varchar PRIMARY KEY NOT NULL, "fr" varchar NOT NULL, "en" varchar NOT NULL, "image_filename" varchar, "category" varchar, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_c44ea1ce140497361d183e93399" UNIQUE ("fr"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "memory_cards"`);
  }
}
