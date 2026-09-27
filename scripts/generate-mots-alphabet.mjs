/**
 * Genere backend/src/modules/alphabet/data/mots.json depuis Lexique 3.83.
 *
 * ── Pourquoi une liste derivee, et non une API ───────────────────────────────────────
 *
 * Un appel a un dictionnaire en ligne ferait dependre le module du reseau, pour une
 * application dont l'usage est une enfant assise devant l'ecran. Et la seule API
 * francaise libre trouvee ne sait filtrer que sur la PREMIERE lettre, alors que tout
 * l'exercice consiste a trouver des mots qui partagent leurs trois ou quatre premieres.
 *
 * Une liste derivee, elle, ne se maintient pas : on ne la relit pas, on ne l'edite pas.
 * Si les criteres changent un jour, on relance ce script.
 *
 * ── Ce qui est garde ─────────────────────────────────────────────────────────────────
 *
 * Les LEMMES seulement. Sans cela la liste se remplit de formes conjuguees et de
 * pluriels, et l'on ferait ranger « chantais » a cote de « chanter » : deux mots qui
 * n'apprennent rien sur l'ordre alphabetique, seulement sur la conjugaison.
 *
 * Noms, adjectifs et verbes. Quatre a douze lettres. Ni trait d'union ni apostrophe :
 * ils changent la regle de tri et meritent leur propre lecon.
 *
 * Un seuil de frequence BAS. Lionel a tranche : ranger ne demande pas de comprendre, et
 * un mot savant ne gene pas. Le seuil ne sert donc qu'a ecarter ce qui n'apparait
 * pratiquement jamais (« haquet », « gyrus », « durit »), et qui ferait douter de la
 * liste plutot que travailler l'alphabet.
 *
 * Usage : node scripts/generate-mots-alphabet.mjs [chemin/vers/Lexique383.tsv]
 * Source : http://www.lexique.org/databases/Lexique383/Lexique383.tsv (CC BY-SA 4.0)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SOURCE = process.argv[2] ?? join(ROOT, 'scripts/data/Lexique383.tsv');
const SORTIE = join(ROOT, 'backend/src/modules/alphabet/data/mots.json');

const LONGUEUR_MIN = 4;
const LONGUEUR_MAX = 12;
const NATURES = new Set(['NOM', 'ADJ', 'VER']);
/** Sous ce seuil, le mot n'apparait pratiquement jamais dans un livre. */
const FREQUENCE_MIN = 0.05;

/** Sans accents ni cedille, pour comparer a la liste des mots ecartes. */
const nu = (mot) =>
  mot.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');

const ecartes = new Set(
  readFileSync(join(__dirname, 'data/mots-ecartes.txt'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#')),
);

const lignes = readFileSync(SOURCE, 'utf8').split('\n');
const colonnes = lignes[0].split('\t');
const rang = (nom) => colonnes.indexOf(nom);
const [iOrtho, iCgram, iIslem, iFreq] = [
  rang('ortho'),
  rang('cgram'),
  rang('islem'),
  rang('freqlivres'),
];

const vus = new Set();
const retenus = [];
const comptes = { flechi: 0, nature: 0, longueur: 0, caracteres: 0, rare: 0, ecarte: 0 };

for (let i = 1; i < lignes.length; i++) {
  const c = lignes[i].split('\t');
  if (c.length < colonnes.length) continue;
  const mot = c[iOrtho];

  if (c[iIslem] !== '1') { comptes.flechi++; continue; }
  if (!NATURES.has(c[iCgram])) { comptes.nature++; continue; }
  if (mot.length < LONGUEUR_MIN || mot.length > LONGUEUR_MAX) { comptes.longueur++; continue; }
  if (!/^[a-zàâäçéèêëîïôöùûüÿœæ]+$/.test(mot)) { comptes.caracteres++; continue; }
  if (Number(c[iFreq] || 0) < FREQUENCE_MIN) { comptes.rare++; continue; }
  if (ecartes.has(nu(mot))) { comptes.ecarte++; continue; }
  if (vus.has(mot)) continue;

  vus.add(mot);
  retenus.push(mot);
}

// Tri francais des l'ecriture : le module s'en sert comme reference, et un tri fait
// ailleurs pourrait ne pas etre le meme. « elan » se range avant « zebre », ce qu'une
// comparaison brute d'unites Unicode fait exactement a l'envers.
retenus.sort((a, b) => a.localeCompare(b, 'fr'));

mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, JSON.stringify(retenus), 'utf8');

console.log(`${retenus.length} mots ecrits dans ${SORTIE}`);
console.log('ecartes :', comptes);
