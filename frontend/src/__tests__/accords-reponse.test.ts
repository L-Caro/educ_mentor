import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  normaliseReponse,
  reponseCorrecte,
} from 'src/modules/accords/accords.reponse';

/**
 * `normaliseReponse` existe en DEUX exemplaires, un par paquet, parce que la validation
 * d'une saisie libre est faite côté client par `<GameEngine>` et que les deux paquets
 * n'ont aucune dépendance entre eux. Même situation que `dictee.tokens.ts`, qui reproduit
 * `dictee.logic.ts`.
 *
 * Une divergence entre les deux ne casserait ni le typage ni le lint : elle rendrait
 * fausse une réponse juste, ou l'inverse, et l'enfant aurait raison contre la machine. Ce
 * test compare les deux corps de fonction sur disque.
 */

const FRONT = readFileSync(
  join(__dirname, '../modules/accords/accords.reponse.ts'),
  'utf-8',
);
const BACK = readFileSync(
  join(__dirname, '../../../backend/src/modules/accords/accords.logic.ts'),
  'utf-8',
);

/** Le corps d'une fonction exportée, espaces normalisés. */
function corps(source: string, nom: string): string {
  const debut = source.indexOf(`export function ${nom}(`);
  expect(debut, `${nom} introuvable`).toBeGreaterThan(-1);
  const ouvrante = source.indexOf('{', debut);
  const fin = source.indexOf('\n}', ouvrante);
  return source
    .slice(ouvrante + 1, fin)
    .replace(/\s+/g, ' ')
    .trim();
}

describe('normalisation dupliquée', () => {
  it('a le même corps des deux côtés', () => {
    expect(corps(FRONT, 'normaliseReponse')).toBe(
      corps(BACK, 'normaliseReponse'),
    );
  });

  it('compare de la même façon des deux côtés', () => {
    expect(corps(FRONT, 'reponseCorrecte')).toBe(corps(BACK, 'reponseCorrecte'));
  });
});

describe('validation d’une saisie', () => {
  it("n'enlève JAMAIS les accents : l'orthographe EST la réponse", () => {
    // `geometrie.game.tsx` accepte « decagone » parce qu'il évalue la géométrie, pas
    // l'orthographe. Ici, accepter « des gateaux » enseignerait l'inverse de la leçon.
    expect(reponseCorrecte('des gâteaux', 'des gateaux')).toBe(false);
    expect(reponseCorrecte('les écoles', 'les ecoles')).toBe(false);
    expect(reponseCorrecte('la petite école', 'la petite ecole')).toBe(false);
  });

  it('exige toutes les marques du pluriel', () => {
    expect(reponseCorrecte('les petits chats', 'les petit chats')).toBe(false);
    expect(reponseCorrecte('les petits chats', 'les petits chat')).toBe(false);
    expect(reponseCorrecte('les petits chats', 'le petit chat')).toBe(false);
    expect(reponseCorrecte('les petits chats', 'les petits chats')).toBe(true);
  });

  it('tolère ce qui ne concerne pas l’accord', () => {
    // La casse : l'énoncé s'affiche en minuscules, une majuscule n'est pas une faute
    // d'accord. L'apostrophe : un clavier donne `'`, l'énoncé affiche `’`.
    expect(reponseCorrecte('l’école', "l'école")).toBe(true);
    expect(reponseCorrecte('l’école', "  L'École ")).toBe(true);
    expect(reponseCorrecte('les petits chats', 'les   petits  chats')).toBe(true);
  });

  it('est idempotente', () => {
    const brut = "  L'ÉCOLE   Propre ";
    expect(normaliseReponse(normaliseReponse(brut))).toBe(normaliseReponse(brut));
  });
});
