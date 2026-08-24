/**
 * Compare le schéma réel d'une base au schéma que TypeORM produirait depuis les entités.
 *
 * Pourquoi : le projet a vécu sous `synchronize: true`, donc le schéma d'une base peut avoir
 * dérivé des entités sans que personne ne le sache. La migration de référence utilise
 * `CREATE TABLE IF NOT EXISTS` : sur une base qui a dérivé, elle ne corrigerait rien **et ne
 * dirait rien**. Ce script est le garde-fou : à lancer sur la production **avant** le premier
 * déploiement en mode migration.
 *
 * Usage :
 *   npm run db:check                              # base par défaut (<repo>/data/educmentor.db)
 *   DB_PATH=/app/data/educmentor.db npm run db:check
 *
 * Sortie : code 0 si le schéma correspond, 1 sinon (utilisable dans un script de déploiement).
 */
import { DataSource } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const SRC = path.resolve(__dirname, '../src');
const REPO_ROOT = path.resolve(__dirname, '../..');

const livePath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(REPO_ROOT, 'data/educmentor.db');

/** Tables gérées par SQLite ou TypeORM, hors périmètre de la comparaison. */
const IGNORED = new Set(['sqlite_sequence', 'migrations', 'typeorm_metadata']);

type Schema = Map<string, string>;

/** Normalise le DDL : SQLite conserve la mise en forme d'origine, pas nous. */
function normalize(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

async function readSchema(dataSource: DataSource): Promise<Schema> {
  const rows: { name: string; sql: string }[] = await dataSource.query(
    "select name, sql from sqlite_master where type = 'table' and sql is not null",
  );
  return new Map(
    rows
      .filter((r) => !IGNORED.has(r.name))
      .map((r) => [r.name, normalize(r.sql)]),
  );
}

async function main() {
  if (!fs.existsSync(livePath)) {
    console.error(`✗ Base introuvable : ${livePath}`);
    process.exit(1);
  }

  const entityGlob = path.join(
    SRC,
    `**/*.entity.${__filename.endsWith('.js') ? 'js' : 'ts'}`,
  );

  // Base témoin : le schéma que les entités décrivent aujourd'hui, créé à neuf en zone temporaire.
  const referencePath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'educmentor-schema-')),
    'reference.db',
  );
  const reference = new DataSource({
    type: 'better-sqlite3',
    database: referencePath,
    entities: [entityGlob],
    synchronize: true,
  });

  const live = new DataSource({
    type: 'better-sqlite3',
    database: livePath,
    entities: [entityGlob],
    synchronize: false,
  });

  await reference.initialize();
  await live.initialize();

  const expected = await readSchema(reference);
  const actual = await readSchema(live);

  await reference.destroy();
  await live.destroy();
  fs.rmSync(path.dirname(referencePath), { recursive: true, force: true });

  const problems: string[] = [];
  for (const name of [
    ...new Set([...expected.keys(), ...actual.keys()]),
  ].sort()) {
    if (!actual.has(name)) {
      problems.push(
        `table absente de la base : ${name}\n    la migration la créera`,
      );
    } else if (!expected.has(name)) {
      problems.push(
        `table orpheline (plus aucune entité) : ${name}\n    aucune migration ne la supprimera`,
      );
    } else if (expected.get(name) !== actual.get(name)) {
      problems.push(
        `colonnes divergentes : ${name}\n` +
          `    base    ${actual.get(name)}\n` +
          `    entités ${expected.get(name)}`,
      );
    }
  }

  console.log(`Base    : ${livePath}`);
  console.log(
    `Tables  : ${actual.size} en base, ${expected.size} attendues par les entités\n`,
  );

  if (problems.length === 0) {
    console.log('✓ Le schéma de la base correspond aux entités.');
    return;
  }

  console.error(`✗ ${problems.length} écart(s) :\n`);
  for (const problem of problems) console.error(`  - ${problem}\n`);
  console.error(
    'Écrire une migration pour rattraper ces écarts avant de déployer.',
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
