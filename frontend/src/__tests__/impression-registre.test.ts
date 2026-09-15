import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Un exercice imprimable vit a DEUX endroits qui doivent rester d'accord :
 *   1. `frontend/src/modules/<dossier>/<dossier>.impression.tsx`  ce que l'adulte coche
 *   2. `backend/src/modules/impression/impression.service.ts`     ce qui sait le produire
 *
 * Le lien entre les deux est une CHAINE, `module/exercice`, assemblee cote serveur depuis
 * l'identifiant du module et la cle de l'exercice. Rien ne la verifie : cocher un exercice
 * que le serveur ne connait pas rend une 400, et cocher un exercice que personne ne coche
 * ne rend rien du tout. Aucun des deux ne se voit avant d'imprimer.
 *
 * C'est exactement le defaut qui a frappe le peage : le dossier s'appelle `calcul`, le
 * module declare `calcul-mental`, et une chaine batie sur le dossier ne trouvait rien.
 * Seul un test de bout en bout l'avait attrape, longtemps apres.
 *
 * Les fichiers sont lus sur disque plutot qu'importes, comme dans `modules-registry` : les
 * deux paquets ont des configurations TypeScript distinctes, et importer un fournisseur
 * entrainerait tout le store Redux dans un test qui n'en a pas besoin.
 */

const MODULES_DIR = join(__dirname, '..', 'modules');
const SERVICE_PATH = join(
  __dirname,
  '../../../backend/src/modules/impression/impression.service.ts',
);

/** Les paires `module/exercice` declarees cote frontend, avec l'IDENTIFIANT du module et
 * non le nom de son dossier : les deux different parfois. */
function paireDeclarees(): string[] {
  const paires: string[] = [];
  for (const entree of readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!entree.isDirectory()) continue;
    const dossier = entree.name;
    const fournisseur = join(MODULES_DIR, dossier, `${dossier}.impression.tsx`);
    const descripteur = join(MODULES_DIR, dossier, `${dossier}.module.tsx`);
    if (!existsSync(fournisseur) || !existsSync(descripteur)) continue;

    const id = /\bid:\s*'([^']+)'/.exec(readFileSync(descripteur, 'utf-8'))?.[1];
    if (!id) continue;

    // Seulement le bloc `exercices`. Les reglages du module portent eux aussi une `cle`
    // (« quelles tables », « quels verbes »), et les compter ici ferait echouer le test
    // sur des paires qui n'ont jamais eu a exister.
    const source = readFileSync(fournisseur, 'utf-8');
    const exercices = source.slice(
      source.indexOf('exercices: ['),
      source.includes('\n  options: [')
        ? source.indexOf('\n  options: [')
        : source.length,
    );
    for (const trouve of exercices.matchAll(/^\s{6}cle: '([^']+)',$/gm)) {
      paires.push(`${id}/${trouve[1]}`);
    }
  }
  return paires.sort();
}

/** Les paires que le repartiteur du serveur sait traiter. */
function paireServies(): string[] {
  const source = readFileSync(SERVICE_PATH, 'utf-8');
  return [...source.matchAll(/^\s{6}case '([^']+\/[^']+)':$/gm)]
    .map((trouve) => trouve[1])
    .sort();
}

/** Les fournisseurs effectivement branches sur leur descripteur de module : un fichier
 * `<id>.impression.tsx` que personne n'importe n'apparait sur aucune feuille. */
function fournisseursBranches(): string[] {
  const orphelins: string[] = [];
  for (const entree of readdirSync(MODULES_DIR, { withFileTypes: true })) {
    if (!entree.isDirectory()) continue;
    const dossier = entree.name;
    if (!existsSync(join(MODULES_DIR, dossier, `${dossier}.impression.tsx`)))
      continue;
    const descripteur = readFileSync(
      join(MODULES_DIR, dossier, `${dossier}.module.tsx`),
      'utf-8',
    );
    if (!/\bimpression:\s*\w+Impression,/.test(descripteur))
      orphelins.push(dossier);
  }
  return orphelins;
}

describe('registre des exercices imprimables', () => {
  it('trouve bien les deux registres (garde-fou sur les expressions régulières)', () => {
    // Sans ce garde-fou, une expression régulière qui ne trouve plus rien ferait passer
    // les deux tests suivants en comparant deux listes vides.
    expect(paireDeclarees().length).toBeGreaterThan(20);
    expect(paireServies().length).toBeGreaterThan(20);
  });

  it('ne coche rien que le serveur ne sache produire', () => {
    // Une case cochée que le répartiteur ne connaît pas rend une 400, sans dire laquelle.
    expect({
      cocheMaisIntrouvable: paireDeclarees().filter(
        (paire) => !paireServies().includes(paire),
      ),
    }).toEqual({ cocheMaisIntrouvable: [] });
  });

  it('ne produit rien que personne ne puisse cocher', () => {
    // L'inverse est plus silencieux encore : un générateur écrit, testé, et que la page de
    // composition n'offre jamais. Il ne tombe pas en panne, il n'existe pas.
    expect({
      serviMaisIncochable: paireServies().filter(
        (paire) => !paireDeclarees().includes(paire),
      ),
    }).toEqual({ serviMaisIncochable: [] });
  });

  it('branche chaque fournisseur sur son descripteur de module', () => {
    // Un `<id>.impression.tsx` que le descripteur n'importe pas n'apparaît sur aucune
    // feuille, et rien ne le signale : le module manque simplement dans la liste.
    expect({ fournisseursOrphelins: fournisseursBranches() }).toEqual({
      fournisseursOrphelins: [],
    });
  });
});
