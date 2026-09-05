/**
 * DataSource dédiée à la CLI TypeORM (génération / inspection des migrations), en local.
 *
 * Ce fichier n'est PAS utilisé par l'application : au démarrage, Nest configure sa connexion
 * dans `database.module.ts` et exécute les migrations lui-même (`migrationsRun: true`).
 * La CLI ne sait pas lire la config NestJS, d'où ce doublon : les deux doivent rester cohérents.
 *
 * Usage (depuis backend/) :
 *   npm run migration:generate -- src/database/migrations/NomDeLaMigration
 *   npm run migration:show
 *   npm run migration:revert
 *
 * `migration:run` n'est pas exposé : l'application applique ses migrations seule au boot.
 * Le chemin de base par défaut est `<repo>/data/educmentor.db`, celui monté par les deux
 * docker-compose. Le surcharger au besoin : `DB_PATH=/chemin/vers.db npm run migration:show`.
 */
import { DataSource } from 'typeorm';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SRC, '../..');
const isCompiled = __filename.endsWith('.js');
const ext = isCompiled ? 'js' : 'ts';

export default new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(REPO_ROOT, 'data/educmentor.db'),
  entities: [path.join(SRC, `**/*.entity.${ext}`)],
  migrations: [path.join(SRC, `database/migrations/*.${ext}`)],
  // Jamais de synchronize ici : le schéma ne change que par migration.
  synchronize: false,
});
