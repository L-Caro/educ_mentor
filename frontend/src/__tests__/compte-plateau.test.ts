import { describe, expect, it } from 'vitest';
import {
  appliquer,
  atteint,
  disponibles,
  ecart,
  ecrireEtape,
  encode,
  decode,
  estCorrecte,
  rejouer,
} from 'src/modules/compte/compteValue';
import type { CompteQuestion, Etape } from 'src/modules/compte/compte.type';

const question: CompteQuestion = {
  item_key: 'compte_324_100-75-8-6-3-2',
  skill_key: 'compte_2_etapes',
  cible: 324,
  plaques: [100, 75, 8, 6, 3, 2],
  solution: [
    { a: 100, operation: '+', b: 8, resultat: 108 },
    { a: 108, operation: '×', b: 3, resultat: 324 },
  ],
  operations: ['+', '-', '×', '÷'],
};

describe('ce que l’enfant a le droit de poser', () => {
  it('autorise « × 1 », que le générateur refuse', () => {
    // Ce n'est pas une divergence par négligence, c'est la décision : le générateur
    // refuse « × 1 » parce qu'une étape morte dans une solution DONNÉE EN EXEMPLE est
    // absurde. Griser la touche pour l'enfant lui apprendrait que l'application a un
    // avis, pas que le coup est inutile — elle le découvre en le jouant.
    expect(appliquer(7, '×', 1)).toBe(7);
    expect(appliquer(7, '÷', 1)).toBe(7);
  });

  it('refuse ce que le jeu ne sait pas représenter', () => {
    expect(appliquer(3, '-', 8)).toBeNull(); // pas de plaque négative
    expect(appliquer(5, '-', 5)).toBeNull(); // une plaque à 0 ne sert plus à rien
    expect(appliquer(7, '÷', 2)).toBeNull(); // pas de plaque à virgule
    expect(appliquer(7, '÷', 0)).toBeNull();
  });
});

describe('l’état du plateau', () => {
  it('remplace les deux plaques consommées par le résultat', () => {
    const etapes: Etape[] = [{ a: 100, operation: '×', b: 3, resultat: 300 }];
    expect(disponibles(question.plaques, etapes).map((p) => p.nombre)).toEqual([
      75, 8, 6, 2, 300,
    ]);
  });

  it('marque comme OBTENUE la plaque qu’elle a fabriquée', () => {
    // Après trois étapes, savoir d'où vient un nombre est ce qui rend le plateau
    // relisible.
    const etapes: Etape[] = [{ a: 8, operation: '+', b: 6, resultat: 14 }];
    const plateau = disponibles(question.plaques, etapes);
    expect(plateau.filter((p) => p.obtenue).map((p) => p.nombre)).toEqual([14]);
  });

  it('n’attribue pas l’origine d’après le NOMBRE d’étapes', () => {
    // Le calcul « six plaques moins deux par étape » se trompait dès qu'une étape
    // consommait le résultat de la précédente : ici la deuxième étape n'ôte qu'une
    // plaque distribuée, pas deux.
    const etapes: Etape[] = [
      { a: 8, operation: '+', b: 6, resultat: 14 },
      { a: 14, operation: '×', b: 2, resultat: 28 },
    ];
    const plateau = disponibles(question.plaques, etapes);
    expect(plateau.map((p) => [p.nombre, p.obtenue])).toEqual([
      [100, false],
      [75, false],
      [3, false],
      [28, true],
    ]);
  });

  it('laisse employer les deux exemplaires d’un même nombre, mais pas deux fois le même', () => {
    const plaques = [5, 5, 2, 3, 4, 6];
    expect(
      rejouer(plaques, [
        { a: 5, operation: '+', b: 5, resultat: 10 },
        { a: 10, operation: '×', b: 2, resultat: 20 },
      ]),
    ).toBe(20);
    // Un seul 100 : « 100 × 100 » n'est pas une opération, c'est une plaque inventée.
    expect(
      rejouer([100, 5, 2, 3, 4, 6], [
        { a: 100, operation: '×', b: 100, resultat: 10000 },
      ]),
    ).toBeNull();
  });

  it('ne croit pas le résultat annoncé : il est recalculé', () => {
    expect(
      rejouer(question.plaques, [
        { a: 100, operation: '+', b: 75, resultat: 324 },
      ]),
    ).toBeNull();
  });
});

describe('juger la recherche', () => {
  const chemin: Etape[] = [
    { a: 100, operation: '×', b: 3, resultat: 300 },
    { a: 300, operation: '+', b: 8, resultat: 308 },
  ];

  it('ne compte juste que la cible EXACTE', () => {
    expect(estCorrecte(question, chemin)).toBe(false);
    expect(
      estCorrecte(question, [
        { a: 75, operation: '-', b: 2, resultat: 73 },
        { a: 73, operation: '+', b: 8, resultat: 81 },
      ]),
    ).toBe(false);
  });

  it('dit de COMBIEN elle a manqué', () => {
    // « 308 au lieu de 324 » et « 12 au lieu de 324 » sont deux choses très différentes :
    // une recherche qui a presque abouti, et un abandon. L'écran de résultats les
    // afficherait pareil sans cet écart.
    expect(atteint(question, encode(chemin))).toBe(308);
    expect(ecart(question, encode(chemin))).toBe(16);
  });

  it('ne juge rien quand rien n’a été posé', () => {
    expect(atteint(question, encode([]))).toBeNull();
    expect(estCorrecte(question, [])).toBe(false);
  });

  it('survit à une réponse illisible sans planter la correction', () => {
    expect(decode('{')).toEqual([]);
    expect(decode('[{"a":1}]')).toEqual([]);
    expect(atteint(question, 'n’importe quoi')).toBeNull();
  });

  it('accepte la solution de référence du serveur', () => {
    // C'est ce que fait la fiche après un échec : elle montre ce chemin. S'il ne menait
    // pas à la cible depuis ces plaques, elle enseignerait une fausseté.
    expect(rejouer(question.plaques, question.solution)).toBe(question.cible);
  });

  it('rejette un chemin qui invente une plaque', () => {
    // 48 ne figure pas dans le tirage. Une solution qui s'en sert n'est pas une solution,
    // et cela vaut aussi pour celle qui viendrait du serveur.
    expect(
      rejouer(question.plaques, [
        { a: 100, operation: '×', b: 3, resultat: 300 },
        { a: 300, operation: '+', b: 48, resultat: 348 },
      ]),
    ).toBeNull();
  });
});

describe('l’écriture d’une étape', () => {
  it('se lit comme au tableau', () => {
    expect(ecrireEtape({ a: 25, operation: '×', b: 4, resultat: 100 })).toBe(
      '25 × 4 = 100',
    );
  });
});
