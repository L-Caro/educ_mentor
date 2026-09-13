import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estLibre, raisonDuBlocage } from 'src/modules/mahjong/tourelle';
import {
  ombrePortee,
  COULEUR_BLOQUEE,
  ECLAIRAGE_BLOQUEE,
} from 'src/modules/mahjong/mahjong.geometrie';
import { FORMES } from 'src/modules/mahjong/formes';

const TUILE = readFileSync(
  join(__dirname, '../modules/mahjong/TuileBloc.tsx'),
  'utf-8',
);
const PLATEAU = readFileSync(
  join(__dirname, '../modules/mahjong/MahjongDifficile.tsx'),
  'utf-8',
);

describe('pourquoi une tuile est refusee', () => {
  it('ne reproche rien a une tuile jouable', () => {
    expect(raisonDuBlocage([{ x: 0, y: 0, z: 0 }], { x: 0, y: 0, z: 0 })).toEqual({
      cause: null,
      bloqueurs: [],
    });
  });

  it('designe la tuile posee DESSUS, et elle seule', () => {
    const dessous = { x: 2, y: 2, z: 0 };
    const dessus = { x: 2, y: 2, z: 1 };
    const aCote = { x: 4, y: 2, z: 0 };
    const raison = raisonDuBlocage([dessous, dessus, aCote], dessous);
    expect(raison.cause).toBe('dessus');
    expect(raison.bloqueurs).toEqual([dessus]);
  });

  it('designe les DEUX cotes, parce qu’un seul degage suffirait', () => {
    const milieu = { x: 4, y: 0, z: 0 };
    const gauche = { x: 2, y: 0, z: 0 };
    const droite = { x: 6, y: 0, z: 0 };
    const raison = raisonDuBlocage([gauche, milieu, droite], milieu);
    expect(raison.cause).toBe('cotes');
    expect(raison.bloqueurs).toEqual([gauche, droite]);
  });

  it('ne reproche rien quand un seul cote est pris', () => {
    const milieu = { x: 4, y: 0, z: 0 };
    const gauche = { x: 2, y: 0, z: 0 };
    expect(raisonDuBlocage([gauche, milieu], milieu).cause).toBeNull();
  });

  it('dit la meme chose que `estLibre`, sur les dix dispositions', () => {
    // Deux fonctions, une seule verite : si elles divergeaient, le jeu refuserait une
    // tuile sans savoir quoi montrer, ou en designerait une qu'il accepte.
    for (const forme of FORMES) {
      for (const position of forme.slots) {
        const libre = estLibre(forme.slots, position);
        const raison = raisonDuBlocage(forme.slots, position);
        expect({ id: forme.id, position, coherent: libre === (raison.cause === null) }).toEqual({
          id: forme.id,
          position,
          coherent: true,
        });
      }
    }
  });
});

describe('l’hypothese que fait `estLibre`', () => {
  it('ne trouve AUCUNE tuile en surplomb, sur les dix dispositions', () => {
    // `estLibre` ne regarde que l'etage z+1 : une tuile posee deux etages plus haut, en
    // porte-a-faux, passerait inapercue et le jeu accepterait une tuile couverte.
    // Physiquement possible (elle reposerait sur une voisine sans reposer sur celle du
    // dessous), et ces dispositions n'en contiennent aucune. Ce test le garde : une
    // disposition ajoutee plus tard qui en introduirait une casserait la regle en
    // silence.
    const chevauchent = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;

    for (const forme of FORMES) {
      const surplombs = forme.slots.filter((t) => {
        const justeAuDessus = forme.slots.some((p) => p.z === t.z + 1 && chevauchent(p, t));
        if (justeAuDessus) return false;
        return forme.slots.some((p) => p.z > t.z + 1 && chevauchent(p, t));
      });
      expect({ id: forme.id, surplombs: surplombs.length }).toEqual({
        id: forme.id,
        surplombs: 0,
      });
    }
  });
});

describe('l’ombre porte la hauteur', () => {
  it('s’ecarte franchement quand l’etage monte', () => {
    // C'est le seul indice qui reste pour dire l'etage : le relief d'une tuile est le
    // meme partout, et la luminosite sert desormais a dire la LIBERTE. Une version
    // precedente gardait un decalage fixe et ne faisait grandir que le flou, donc une
    // tuile du quatrieme etage projetait la meme ombre qu'une tuile posee sur la table.
    const sol = ombrePortee(0);
    const haut = ombrePortee(4);
    expect(haut.x).toBeGreaterThan(sol.x * 3);
    expect(haut.y).toBeGreaterThan(sol.y * 3);
    expect(haut.flou).toBeGreaterThan(sol.flou);
  });

  it('reste courte et serree au sol : la tuile TOUCHE la table', () => {
    const sol = ombrePortee(0);
    expect(sol.x).toBeLessThanOrEqual(4);
    expect(sol.y).toBeLessThanOrEqual(4);
  });
});

describe('reperer les tuiles jouables', () => {
  it('fait des jouables les SEULES tuiles colorees', () => {
    // Avec 23 tuiles libres sur 144, il faut les voir d'un coup d'oeil. Une premiere
    // version se contentait d'assombrir a 0,75 : compare a l'ecran sur un vrai plateau,
    // c'etait trop faible - une difference de luminosite se cherche, une difference de
    // couleur saute aux yeux.
    expect(COULEUR_BLOQUEE).toBeLessThanOrEqual(0.25);
    expect(TUILE).toMatch(/grayscale\(\$\{1 - COULEUR_BLOQUEE\}\)/);
  });

  it('garde DEUX indices, jamais la couleur seule', () => {
    // La couleur seule ne doit jamais porter une information a elle toute seule.
    expect(ECLAIRAGE_BLOQUEE).toBeLessThan(1);
    expect(TUILE).toMatch(/brightness\(\$\{ECLAIRAGE_BLOQUEE\}\)/);
  });

  it('laisse les bloquees lisibles : on doit pouvoir y chercher sa paire', () => {
    // Elles sont la moitie du plateau. Les effacer reviendrait a interdire de prevoir.
    expect(ECLAIRAGE_BLOQUEE).toBeGreaterThanOrEqual(0.8);
  });
});

describe('ce qui rend l’explication necessaire', () => {
  it('bloque surtout par des voisines EN DIAGONALE, invisibles a la lecture', () => {
    // C'est le chiffre qui justifie toute la fonctionnalite, et qui doit empecher de la
    // retirer en la croyant superflue. Ces dispositions sont posees en quinconce : la
    // voisine qui bloque est le plus souvent decalee d'une demi-tuile, donc en bas ou en
    // haut a droite. L'enfant voit une tuile qui n'a « rien a droite » et le jeu la
    // refuse.
    let pileACote = 0;
    let enDiagonale = 0;
    for (const forme of FORMES) {
      for (const position of forme.slots) {
        const raison = raisonDuBlocage(forme.slots, position);
        if (raison.cause !== 'cotes') continue;
        for (const bloqueur of raison.bloqueurs) {
          if (bloqueur.y === position.y) pileACote++;
          else enDiagonale++;
        }
      }
    }
    expect(enDiagonale).toBeGreaterThan(pileACote * 3);
  });

  it('laisse une tuile bloquee CLIQUABLE, pour pouvoir l’expliquer', () => {
    // `disabled` la rendait inerte : l'enfant restait devant une tuile muette.
    // `(?<!aria-)` est necessaire : sans lui, `\b` tombe aussi apres le tiret de
    // `aria-disabled`, et le test se validait tout seul.
    expect(TUILE).not.toMatch(/(?<!aria-)disabled=\{/);
    expect(TUILE).toMatch(/aria-disabled=\{!libre\}/);
    expect(PLATEAU).toMatch(/raisonDuBlocage\(cases, cliquee\)/);
  });

  it('ne compte pas ce clic comme un essai', () => {
    // Il n'y avait rien a tenter : gonfler le compteur punirait une question.
    const avantEssais = PLATEAU.indexOf('setEssais((valeur) => valeur + 1)');
    const blocage = PLATEAU.indexOf('setBlocage({ cause: raison.cause');
    expect(blocage).toBeGreaterThan(-1);
    expect(blocage).toBeLessThan(avantEssais);
  });
});
