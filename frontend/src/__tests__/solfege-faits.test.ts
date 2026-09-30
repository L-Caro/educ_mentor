import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Les faits musicaux sont écrits DEUX fois, et doivent rester d'accord :
 *   1. `frontend/src/musique/solfege.ts`            pour le jeu, qui vit dans le navigateur
 *   2. `backend/src/modules/solfege/solfege.logic.ts`  pour la feuille, composée par le serveur
 *
 * La duplication est assumée : les deux paquets n'ont aucune dépendance entre eux, le jeu
 * ne parle jamais au serveur, et la feuille imprimée se compose côté serveur comme celle
 * de tous les autres modules. Ce qui est dupliqué ne changera jamais : sept noms de notes,
 * deux degrés de référence, cinq durées et leurs silences.
 *
 * Ce qui PEUT arriver, en revanche, c'est une faute de frappe d'un seul côté. Elle serait
 * silencieuse : la feuille nommerait une note autrement que l'écran, et personne ne s'en
 * apercevrait avant de corriger un exercice avec sa fille.
 *
 * Les fichiers sont lus sur disque plutôt qu'importés : les deux paquets ont des
 * configurations TypeScript distinctes, sans dépendance entre eux.
 */

const FRONT = join(__dirname, '../musique/solfege.ts');
const BACK = join(
  __dirname,
  '../../../backend/src/modules/solfege/solfege.logic.ts',
);

const lire = (chemin: string) => readFileSync(chemin, 'utf-8');

/** Les sept noms, tels que la constante `NOTES` les déclare. */
function notes(source: string): string[] {
  const bloc = /export const NOTES = \[([^\]]+)\]/.exec(source)?.[1] ?? '';
  return [...bloc.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

/** Les deux degrés que les clés posent sur la ligne du bas, sous la forme `sol: degre(4, 2)`. */
function bases(source: string): string[] {
  return [...source.matchAll(/^\s{2}(sol|fa): degre\((\d+), (\d+)\)/gm)]
    .map((m) => `${m[1]}=${m[2]},${m[3]}`)
    .sort();
}

/** Chaque figure, sa durée et le nom de son silence. */
function figures(source: string): string[] {
  return [
    ...source.matchAll(/^\s{2}(\w+): \{ temps: ([\d.]+), silence: '([^']+)'/gm),
  ]
    .map((m) => `${m[1]}=${m[2]}/${m[3]}`)
    .sort();
}

describe('les faits musicaux : cohérence back/front', () => {
  const front = lire(FRONT);
  const back = lire(BACK);

  it('trouve bien les deux fichiers (garde-fou sur les expressions régulières)', () => {
    // Sans lui, une expression régulière qui ne trouve plus rien ferait passer le test :
    // deux listes vides sont égales.
    expect(notes(front)).toHaveLength(7);
    expect(notes(back)).toHaveLength(7);
    expect(bases(front)).toHaveLength(2);
    expect(bases(back)).toHaveLength(2);
    expect(figures(front).length).toBeGreaterThanOrEqual(5);
    expect(figures(back).length).toBeGreaterThanOrEqual(5);
  });

  it('nomme les sept notes pareil, et dans le même ordre', () => {
    expect(notes(back)).toEqual(notes(front));
  });

  it('pose les clés sur le même degré', () => {
    // Un seul chiffre d'écart, et la feuille imprimée nommerait toutes ses notes autrement
    // que l'écran, sans que rien ne tombe en panne.
    expect(bases(back)).toEqual(bases(front));
  });

  it('donne à chaque figure la même durée et le même silence', () => {
    expect(figures(back)).toEqual(figures(front));
  });
});
