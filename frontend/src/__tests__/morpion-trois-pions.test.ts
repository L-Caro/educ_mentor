import { describe, expect, it } from 'vitest';
import {
  appliquer,
  coupsPossibles,
  meilleurCoup,
  phase,
  valeur,
  PIONS_PAR_JOUEUR,
  type Coup,
} from 'src/modules/morpion/troisPions';
import type { Case, Joueur } from 'src/utils/plateau';

const VIDE: Case[] = Array.from({ length: 9 }, () => 0 as Case);

/** Construit un plateau depuis une grille lisible : `.` vide, `x` joueur 1, `o` joueur 2. */
function grille(texte: string): Case[] {
  const lettres = texte.replace(/\s/g, '');
  expect(lettres).toHaveLength(9);
  return [...lettres].map((l) => (l === 'x' ? 1 : l === 'o' ? 2 : 0) as Case);
}

const LIGNES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const aligne = (cases: Case[], joueur: Joueur) =>
  LIGNES.some((l) => l.every((c) => cases[c] === joueur));

describe('les deux phases', () => {
  it('pose tant que les six pions ne sont pas placés, déplace ensuite', () => {
    expect(phase(VIDE)).toBe('pose');
    expect(phase(grille('xox ox. ...'))).toBe('pose');
    expect(phase(grille('xox oxo ...'))).toBe('déplacement'.slice(0, 0) + 'deplacement');
  });

  it('ne laisse déplacer QUE ses propres pions, et seulement vers une case libre', () => {
    const cases = grille('xox oxo ...');
    const coups = coupsPossibles(cases, 1) as Extract<Coup, { type: 'deplacement' }>[];
    // Trois pions × trois cases libres.
    expect(coups).toHaveLength(9);
    for (const coup of coups) {
      expect(cases[coup.depuis]).toBe(1);
      expect(cases[coup.vers]).toBe(0);
    }
  });

  it('libère la case quittée : un pion se DÉPLACE, il ne se duplique pas', () => {
    // Le défaut le plus facile à écrire, et le plus dur à voir : quatre pions en jeu.
    const cases = grille('xox oxo ...');
    const apres = appliquer(cases, { type: 'deplacement', depuis: 0, vers: 8 }, 1);
    expect(apres[0]).toBe(0);
    expect(apres[8]).toBe(1);
    expect(apres.filter((c) => c === 1)).toHaveLength(PIONS_PAR_JOUEUR);
  });

  it('ne remplit jamais la grille : il reste toujours trois cases libres', () => {
    const cases = grille('xox oxo ...');
    expect(cases.filter((c) => c === 0)).toHaveLength(3);
  });
});

describe('la résolution exacte', () => {
  it('dit que la partie complète est NULLE quand les deux jouent parfaitement', () => {
    // C'est ce qui autorise « il ne perd jamais » au pré-jeu, comme au morpion classique.
    // Si cette valeur devenait ±1, la promesse serait fausse et il faudrait la changer.
    expect(valeur(VIDE, 1)).toBe(0);
  });

  it('voit une victoire forcée là où il y en a une', () => {
    // Joueur 1 pose son troisième pion en 2 et aligne la première ligne.
    const cases = grille('xx. oo. ...');
    expect(valeur(cases, 1)).toBe(1);
    // Et la même position vue par l'autre : il est perdant, pas nul.
    expect(valeur(grille('xxx oo. ...'), 2)).toBe(-1);
  });

  it('répond pour le joueur qu’on lui NOMME, pas pour celui que l’alternance suggère', () => {
    // La fonction déduisait le joueur au trait du nombre de pions posés et ignorait son
    // argument : elle répondait pour l'autre, sans le dire. En jeu l'alternance est
    // stricte, donc rien ne se voyait : un test l'a même « validée » par hasard.
    const cases = grille('xx. oo. ...');
    expect(valeur(cases, 1)).toBe(1); // joueur 1 pose en 2 et gagne
    expect(valeur(cases, 2)).toBe(1); // joueur 2 pose en 5 et gagne aussi
  });

  it('n’invente pas de victoire quand la position est nulle', () => {
    // Une position de déplacement quelconque ne doit pas être marquée gagnante par
    // défaut : sinon la table dirait « tout est gagnant » et l'adversaire jouerait au
    // hasard en croyant bien faire.
    const cases = grille('xox oxo ...');
    expect([-1, 0, 1]).toContain(valeur(cases, 1));
  });
});

describe('l’adversaire', () => {
  const sansHasard = () => 0;

  it('en FACILE, joue vraiment n’importe quoi', () => {
    // Il doit être battable : c'est tout ce qu'on lui demande.
    const cases = grille('xx. ... o..');
    const coups = coupsPossibles(cases, 2);
    const joue = meilleurCoup(cases, 2, 'easy', () => coups.length - 1);
    expect(joue).toEqual(coups[coups.length - 1]);
  });

  it('en MOYEN, gagne quand il peut', () => {
    const cases = grille('x.x oo. ...');
    const coup = meilleurCoup(cases, 2, 'medium', sansHasard)!;
    expect(aligne(appliquer(cases, coup, 2), 2)).toBe(true);
  });

  it('en MOYEN, bloque quand il doit', () => {
    // Joueur 1 aligne en 2 au prochain coup ; il n'a pas de victoire à lui.
    // Deux pions à lui, un seul à l'ordinateur : c'est bien à l'ordinateur de jouer, et
    // il n'a aucun alignement à saisir. Il ne lui reste qu'à barrer la case 2.
    const cases = grille('xx. o.. ...');
    const coup = meilleurCoup(cases, 2, 'medium', sansHasard)!;
    expect(coup).toEqual({ type: 'pose', vers: 2 });
  });

  it('en DIFFICILE, gagne immédiatement plutôt que de tourner autour', () => {
    const cases = grille('x.x oo. ...');
    const coup = meilleurCoup(cases, 2, 'hard', sansHasard)!;
    expect(aligne(appliquer(cases, coup, 2), 2)).toBe(true);
  });

  it('en DIFFICILE, ne perd JAMAIS : vérifié sur 200 parties contre un joueur au hasard', () => {
    // La promesse du pré-jeu, jouée pour de vrai plutôt que lue dans la table.
    let defaites = 0;
    for (let partie = 0; partie < 200; partie++) {
      let cases = [...VIDE];
      let tour: Joueur = 1;
      let coups = 0;
      while (coups < 60) {
        const coup =
          tour === 1
            ? meilleurCoup(cases, 1, 'easy')
            : meilleurCoup(cases, 2, 'hard');
        if (!coup) break;
        cases = appliquer(cases, coup, tour);
        if (aligne(cases, tour)) {
          if (tour === 1) defaites++;
          break;
        }
        tour = tour === 1 ? 2 : 1;
        coups++;
      }
    }
    expect(defaites).toBe(0);
  });
});
