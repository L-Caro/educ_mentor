import { describe, expect, it } from 'vitest';
import {
  colonnesBarrees,
  colonnesFausses,
  colonnesPartielFausses,
  decode,
  encode,
  estComplete,
  estCorrecte,
  lignesPartielles,
  partielAttendu,
  resultatAttendu,
  saisieInitiale,
  saisieVide,
  type PoseSaisie,
} from 'src/modules/pose/poseValue';
import type { PoseQuestion } from 'src/modules/pose/pose.type';

/**
 * Tout est indexé depuis la DROITE, comme on pose une opération. Une inversion d'index
 * passerait le typage sans broncher et produirait des corrections fausses : c'est
 * exactement ce que ces tests verrouillent.
 */

// 2847 − 138 = 2709, par compensation : « 17 » au-dessus du 7, le 3 du bas devenu 4.
const q = (over: Partial<PoseQuestion> = {}): PoseQuestion => ({
  skill_key: 'soustraction_4_retenue',
  operation: 'soustraction',
  operands: [2847, 138],
  answer: 2709,
  answer_length: 4,
  columns: 5,
  has_carry: true,
  method: 'compensation',
  partiels: [],
  retenues: {
    haut: [17, null, null, null, null],
    bas: [null, 4, null, null, null],
  },
  carry_display: 'empty',
  ...over,
});

const saisie = (resultat: string[], reste: Partial<PoseSaisie> = {}): PoseSaisie => ({
  haut: ['', '', '', '', ''],
  bas: ['', '', '', '', ''],
  resultat,
  partiels: [],
  ...reste,
});

describe('resultatAttendu', () => {
  it('range les chiffres depuis la droite et complète les colonnes', () => {
    expect(resultatAttendu(q())).toEqual(['9', '0', '7', '2', '']);
  });

  it("laisse vide la colonne de débordement quand elle ne sert pas", () => {
    const addition = q({ operation: 'addition', operands: [12, 13], answer: 25, columns: 3 });
    expect(resultatAttendu(addition)).toEqual(['5', '2', '']);
  });

  it('remplit la colonne de débordement quand la somme déborde', () => {
    const addition = q({ operation: 'addition', operands: [99, 99], answer: 198, columns: 3 });
    expect(resultatAttendu(addition)).toEqual(['8', '9', '1']);
  });
});

describe('saisieInitiale', () => {
  it('pré-remplit les retenues en difficulté facile', () => {
    const s = saisieInitiale(q({ carry_display: 'filled' }));
    expect(s.haut).toEqual(['17', '', '', '', '']);
    expect(s.bas).toEqual(['', '4', '', '', '']);
    expect(s.resultat.every((c) => c === '')).toBe(true);
  });

  it('laisse tout vide dans les deux autres difficultés', () => {
    for (const carry_display of ['empty', 'hidden'] as const) {
      const s = saisieInitiale(q({ carry_display }));
      expect(s.haut.every((c) => c === '')).toBe(true);
      expect(s.bas.every((c) => c === '')).toBe(true);
    }
  });
});

describe('encode / decode', () => {
  it('fait un aller-retour fidèle', () => {
    const s = saisie(['9', '0', '7', '2', ''], { haut: ['17', '', '', '', ''] });
    expect(decode(encode(s), q())).toEqual(s);
  });

  it('repart d’une grille initiale sur une chaîne vide ou corrompue', () => {
    // Une saisie illisible ne doit pas faire planter la partie en cours.
    expect(decode('', q())).toEqual(saisieVide(q()));
    expect(decode('{{pas du json', q())).toEqual(saisieVide(q()));
    expect(decode('{"haut":["1"]}', q()).resultat).toEqual(['', '', '', '', '']);
  });
});

describe('estComplete', () => {
  // Difficulté « difficile » : aucune case de retenue, seul le résultat compte.
  const sansRetenues = q({ carry_display: 'hidden' });

  it("n'exige pas de remplir toutes les cases", () => {
    // 7059 − 7014 = 45 : la réponse tient sur deux colonnes, les autres restent vides.
    // Exiger le nombre exact de chiffres reviendrait à l'annoncer à l'enfant.
    const court = q({ operands: [7059, 7014], answer: 45, carry_display: 'hidden' });
    expect(estComplete(court, saisie(['5', '4', '', '', '']))).toBe(true);
  });

  it('exige au moins la colonne des unités', () => {
    expect(estComplete(sansRetenues, saisie(['', '', '', '', '']))).toBe(false);
    expect(estComplete(sansRetenues, saisie(['9', '', '', '', '']))).toBe(true);
  });

  it('refuse un trou entre les chiffres', () => {
    // « 5_7 » n'est pas un nombre : c'est une saisie en cours, pas une réponse.
    expect(estComplete(sansRetenues, saisie(['5', '', '7', '', '']))).toBe(false);
    expect(estComplete(sansRetenues, saisie(['5', '4', '7', '', '']))).toBe(true);
  });

  it('exige aussi les retenues en difficulté moyenne', () => {
    // Sans cela, elle pourrait ignorer les cases et l'échafaudage ne servirait à rien.
    const remplie = saisie(['9', '0', '7', '2', '']);
    expect(estComplete(q({ carry_display: 'empty' }), remplie)).toBe(false);
    expect(
      estComplete(q({ carry_display: 'empty' }), {
        ...remplie,
        haut: ['17', '', '', '', ''],
        bas: ['', '4', '', '', ''],
      }),
    ).toBe(true);
  });

  it("n'exige pas les retenues quand elles sont pré-remplies ou absentes", () => {
    const remplie = saisie(['9', '0', '7', '2', '']);
    expect(estComplete(q({ carry_display: 'filled' }), remplie)).toBe(true);
    expect(estComplete(q({ carry_display: 'hidden' }), remplie)).toBe(true);
  });
});

describe('estCorrecte', () => {
  it('valide sur le seul résultat', () => {
    expect(estCorrecte(q(), saisie(['9', '0', '7', '2', '']))).toBe(true);
  });

  it('refuse un résultat faux', () => {
    expect(estCorrecte(q(), saisie(['9', '1', '7', '2', '']))).toBe(false);
  });

  it("ne sanctionne pas une retenue mal notée si le résultat est juste", () => {
    // La compétence visée est de calculer juste ; la notation est un support. Une marque
    // écrite ailleurs mais un calcul correct ne doit pas compter comme une erreur.
    const s = saisie(['9', '0', '7', '2', ''], { haut: ['1', '', '', '', ''] });
    expect(estCorrecte(q(), s)).toBe(true);
  });

  it('refuse un chiffre en trop dans une colonne qui doit rester vide', () => {
    // Les cases se ressemblent toutes : rien n'empêche d'écrire à gauche du nombre.
    // « 12709 » n'est pas « 2709 ».
    expect(estCorrecte(q(), saisie(['9', '0', '7', '2', '1']))).toBe(false);
  });
});

describe('colonnesFausses', () => {
  it('désigne les colonnes à revoir, indexées depuis la droite', () => {
    // Savoir OÙ ça a coincé est l'essentiel de la leçon sur une opération posée.
    expect(colonnesFausses(q(), saisie(['9', '1', '7', '2', '']))).toEqual([1]);
    expect(colonnesFausses(q(), saisie(['8', '1', '7', '2', '']))).toEqual([0, 1]);
    expect(colonnesFausses(q(), saisie(['9', '0', '7', '2', '']))).toEqual([]);
  });
});

describe('colonnesBarrees', () => {
  // 502 − 348 = 154. Par cassage : le 2 devient 12, le 0 devient 9, le 5 devient 4.
  // Les trois chiffres du haut ont été réécrits, donc les trois sont barrés.
  const cassage = (over: Partial<PoseQuestion> = {}): PoseQuestion =>
    q({
      operands: [502, 348],
      answer: 154,
      answer_length: 3,
      columns: 4,
      method: 'cassage',
      retenues: { haut: [12, 9, 4, null], bas: [null, null, null, null] },
      ...over,
    });

  it('barre les chiffres du haut réécrits, par cassage', () => {
    expect(colonnesBarrees(cassage())).toEqual([0, 1, 2]);
  });

  it('ne barre rien par compensation', () => {
    // Sous un « 17 » le 7 reste lisible : la marque s'ajoute au chiffre, elle ne le
    // remplace pas. Le barrer enseignerait l'autre méthode.
    expect(colonnesBarrees(q())).toEqual([]);
  });

  it('ne barre rien sur une addition', () => {
    expect(
      colonnesBarrees(
        q({
          operation: 'addition',
          method: 'cassage',
          retenues: { haut: [null, 1, 1, null, null], bas: [null, null, null, null, null] },
        }),
      ),
    ).toEqual([]);
  });

  it('ignore une marque au-delà de la dernière colonne', () => {
    // `computeRetenues` travaille sur une colonne de plus que la grille : une marque
    // qui tomberait hors grille ne doit pas produire un index sans chiffre à barrer.
    expect(colonnesBarrees(cassage({ columns: 2 }))).toEqual([0, 1]);
  });
});

// ─── Multiplication posée ───────────────────────────────────────────────────

describe('produits partiels', () => {
  /** 247 × 36 = 8892, avec deux produits partiels : 1482 et 741 décalé d'un rang. */
  const mult = (): PoseQuestion => ({
    skill_key: 'multiplication_3_retenue',
    operation: 'multiplication',
    operands: [247, 36],
    answer: 8892,
    answer_length: 4,
    columns: 5,
    has_carry: true,
    retenues: {
      haut: [null, null, null, null, null],
      bas: [null, null, null, null, null],
    },
    carry_display: 'hidden',
    method: 'compensation',
    partiels: [
      { valeur: 1482, decalage: 0 },
      { valeur: 741, decalage: 1 },
    ],
  });

  const saisieMult = (
    partiels: string[][],
    resultat: string[],
  ): PoseSaisie => ({
    haut: ['', '', '', '', ''],
    bas: ['', '', '', '', ''],
    resultat,
    partiels,
  });

  // 1482 → colonnes 0..3 = 2,8,4,1 · 741 décalé → colonnes 1..3 = 1,4,7
  const P0 = ['2', '8', '4', '1', ''];
  const P1 = ['', '1', '4', '7', ''];
  const R = ['2', '9', '8', '8', ''];

  it('place chaque produit à son décalage', () => {
    expect(partielAttendu(mult(), { valeur: 1482, decalage: 0 })).toEqual(P0);
    expect(partielAttendu(mult(), { valeur: 741, decalage: 1 })).toEqual(P1);
  });

  it('demande les lignes intermédiaires dès qu’il y en a plusieurs', () => {
    expect(lignesPartielles(mult())).toHaveLength(2);
  });

  it('n’en demande aucune pour un multiplicateur à un chiffre', () => {
    // Son unique produit EST le résultat : faire écrire deux fois la même ligne
    // n'apprend rien.
    const simple: PoseQuestion = {
      ...mult(),
      operands: [47, 6],
      answer: 282,
      partiels: [{ valeur: 282, decalage: 0 }],
    };
    expect(lignesPartielles(simple)).toEqual([]);
  });

  it('accepte une grille entièrement juste', () => {
    expect(estCorrecte(mult(), saisieMult([P0, P1], R))).toBe(true);
  });

  it('refuse un résultat juste obtenu avec un produit faux', () => {
    // C'est un résultat deviné : la multiplication posée s'apprend par ces lignes-là,
    // contrairement aux retenues, qui restent un support.
    const faux = ['2', '8', '4', '2', ''];
    expect(estCorrecte(mult(), saisieMult([faux, P1], R))).toBe(false);
  });

  it('refuse un produit juste mais mal décalé', () => {
    // Le décalage EST la difficulté de l'opération.
    const malDecale = ['1', '4', '7', '', ''];
    expect(estCorrecte(mult(), saisieMult([P0, malDecale], R))).toBe(false);
  });

  it('signale les colonnes fautives du bon produit', () => {
    const faux = ['2', '8', '9', '1', ''];
    expect(colonnesPartielFausses(mult(), saisieMult([faux, P1], R), 0)).toEqual([2]);
    expect(colonnesPartielFausses(mult(), saisieMult([faux, P1], R), 1)).toEqual([]);
  });

  it('n’est pas complète tant qu’un produit manque', () => {
    // Sans ça l'enfant sauterait au résultat, et le décalage ne serait jamais travaillé.
    expect(estComplete(mult(), saisieMult([P0, ['', '', '', '', '']], R))).toBe(false);
    expect(estComplete(mult(), saisieMult([P0, P1], R))).toBe(true);
  });
});
